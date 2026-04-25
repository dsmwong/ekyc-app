#!/usr/bin/env node

/**
 * Local integration test for the private `getTwilioCredentials` helper.
 *
 * Prerequisite: `twilio serverless:start` is running (or remote base URL provided)
 * so the functions are reachable.
 *
 * Verifies:
 *   1. No subaccountSid         → usingParent:true, hasAuthToken:true,
 *                                 accountSid === .env ACCOUNT_SID
 *   2. Valid subaccount SID     → usingParent:false, hasAuthToken:true,
 *                                 accountSid === the subaccount SID
 *   3. Invalid subaccount SID   → ok:false
 *   4. No response ever contains a raw `authToken` field (security check)
 *
 * Usage:
 *   node scripts/test-subaccount-credentials.js
 *   node scripts/test-subaccount-credentials.js --base https://xxx.twil.io
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const DEFAULT_BASE = 'http://localhost:3000';

function parseArgs() {
  const args = process.argv.slice(2);
  let base = DEFAULT_BASE;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base' && args[i + 1]) {
      base = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log('Usage: node scripts/test-subaccount-credentials.js [--base <url>]');
      process.exit(0);
    }
  }
  return { base: base.replace(/\/$/, '') };
}

function readParentSidFromEnv() {
  try {
    const envPath = path.resolve(__dirname, '..', '.env');
    const contents = fs.readFileSync(envPath, 'utf8');
    const match = contents.match(/^ACCOUNT_SID=(.+)$/m);
    return match ? match[1].trim() : null;
  } catch (_) {
    return null;
  }
}

function request(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = body ? JSON.parse(body) : null; } catch (_) { /* not json */ }
        resolve({ status: res.statusCode, body, json });
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error(`Request to ${url} timed out`));
    });
  });
}

const results = [];
function record(name, passed, detail) {
  results.push({ name, passed, detail });
  const mark = passed ? '✓' : '✗';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
}

function assertNoTokenLeak(body) {
  if (!body) return true;
  if (Object.prototype.hasOwnProperty.call(body, 'authToken')) return false;
  if (Object.prototype.hasOwnProperty.call(body, 'auth_token')) return false;
  // Catch a token smuggled as a value against an auth-token-ish key.
  const asString = JSON.stringify(body);
  return !/"(auth[_-]?token)"\s*:\s*"[a-f0-9]{32}"/i.test(asString);
}

async function main() {
  const { base } = parseArgs();
  const parentSid = readParentSidFromEnv();
  console.log(`\nRunning tests against ${base}`);
  if (parentSid) console.log(`Parent SID from .env: ${parentSid}`);
  console.log();

  // 1. No subaccountSid → parent credentials
  try {
    const res = await request(`${base}/test/getTwilioCredentials`);
    const body = res.json;
    record('Parent call returns 200', res.status === 200, `status=${res.status}`);
    record('Parent call ok === true', body && body.ok === true,
      body ? '' : 'no body');
    record('Parent call usingParent === true', body && body.usingParent === true);
    record('Parent call hasAuthToken === true', body && body.hasAuthToken === true);
    if (parentSid) {
      record('Parent call accountSid matches .env ACCOUNT_SID',
        body && body.accountSid === parentSid,
        body ? `got ${body.accountSid}` : '');
    }
    record('Parent call body has NO raw authToken', assertNoTokenLeak(body));
  } catch (err) {
    record('Parent call', false, err.message);
  }

  // 2. Pick a real subaccount SID from the list endpoint.
  let subaccountSid;
  try {
    const listRes = await request(`${base}/fetchSubaccountList`);
    if (listRes.status !== 200 || !Array.isArray(listRes.json) || listRes.json.length === 0) {
      record('Fetch a subaccount from /fetchSubaccountList', false,
        `status=${listRes.status}`);
      return summarise();
    }
    subaccountSid = listRes.json[0].sid;
    record('Fetch a subaccount from /fetchSubaccountList', true,
      `picked ${subaccountSid}`);
  } catch (err) {
    record('Fetch a subaccount from /fetchSubaccountList', false, err.message);
    return summarise();
  }

  // 3. Valid subaccount SID → subaccount credentials
  try {
    const res = await request(`${base}/test/getTwilioCredentials?subaccountSid=${subaccountSid}`);
    const body = res.json;
    record('Subaccount call returns 200', res.status === 200);
    record('Subaccount call ok === true', body && body.ok === true);
    record('Subaccount call usingParent === false', body && body.usingParent === false);
    record('Subaccount call hasAuthToken === true', body && body.hasAuthToken === true);
    record('Subaccount call accountSid matches requested SID',
      body && body.accountSid === subaccountSid,
      body ? `got ${body.accountSid}` : '');
    record('Subaccount call body has NO raw authToken', assertNoTokenLeak(body));
  } catch (err) {
    record('Subaccount call', false, err.message);
  }

  // 4. Invalid subaccount SID → ok:false
  try {
    const res = await request(`${base}/test/getTwilioCredentials?subaccountSid=ACnotarealsid0000000000000000000000`);
    const body = res.json;
    record('Invalid SID call returns ok:false', body && body.ok === false,
      body ? `body=${JSON.stringify(body).slice(0, 120)}` : 'no body');
    record('Invalid SID call body has NO raw authToken', assertNoTokenLeak(body));
  } catch (err) {
    record('Invalid SID call', false, err.message);
  }

  summarise();
}

function summarise() {
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  console.log('\n-------------------------------------------');
  console.log(`Passed: ${passed}  |  Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('\nUnexpected error:', err);
  process.exit(1);
});
