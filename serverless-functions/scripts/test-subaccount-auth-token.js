#!/usr/bin/env node

/**
 * Local integration test for the private fetchSubaccountAuthToken helper.
 *
 * Prerequisite: `npm start` is running in another terminal (or in the background)
 * so twilio-run serves the functions at http://localhost:3000.
 *
 * Usage:
 *   node scripts/test-subaccount-auth-token.js
 *   node scripts/test-subaccount-auth-token.js --base http://localhost:3000
 */

const http = require('http');
const https = require('https');
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
      console.log('Usage: node scripts/test-subaccount-auth-token.js [--base <url>]');
      process.exit(0);
    }
  }
  return { base: base.replace(/\/$/, '') };
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

async function main() {
  const { base } = parseArgs();
  console.log(`\nRunning tests against ${base}\n`);

  // 1. Pick a subaccount SID
  let subaccountSid;
  try {
    const listRes = await request(`${base}/fetchSubaccountList`);
    if (listRes.status !== 200 || !Array.isArray(listRes.json) || listRes.json.length === 0) {
      record('Fetch a subaccount from /fetchSubaccountList', false,
        `status=${listRes.status}, got ${listRes.json ? JSON.stringify(listRes.json).slice(0, 100) : 'no JSON'}`);
      return summarise();
    }
    subaccountSid = listRes.json[0].sid;
    record('Fetch a subaccount from /fetchSubaccountList', true,
      `picked ${subaccountSid} (${listRes.json[0].friendlyName})`);
  } catch (err) {
    record('Fetch a subaccount from /fetchSubaccountList', false, err.message);
    return summarise();
  }

  // 2. Public test wrapper should succeed AND NOT leak the auth token
  try {
    const wrapRes = await request(`${base}/test/fetchSubaccountAuthToken?subaccountSid=${subaccountSid}`);
    const body = wrapRes.json;

    if (wrapRes.status !== 200) {
      record('/test/fetchSubaccountAuthToken returns 200', false, `got ${wrapRes.status}`);
    } else {
      record('/test/fetchSubaccountAuthToken returns 200', true);
    }

    const okFlag = body && body.ok === true;
    record('Response ok === true', !!okFlag, okFlag ? '' : `body=${JSON.stringify(body)}`);

    const hasFlag = body && body.hasAuthToken === true;
    record('Response hasAuthToken === true', !!hasFlag);

    const leaks = body && Object.prototype.hasOwnProperty.call(body, 'authToken');
    record('Response does NOT contain a raw authToken field', !leaks,
      leaks ? 'SECURITY LEAK — authToken present in payload' : 'no token in payload');
  } catch (err) {
    record('/test/fetchSubaccountAuthToken call', false, err.message);
  }

  // 3. Private helper must not serve a normal response over HTTP.
  //    Locally, twilio-run lists the file as a route but invocation fails
  //    because there is no `handler` export — response is 404 or 5xx,
  //    never a successful 200 with an auth token.
  //    In production, the Twilio runtime returns 404 for .private.js files.
  try {
    const privRes = await request(`${base}/fetchSubaccountAuthToken?subaccountSid=${subaccountSid}`);
    const blocked = privRes.status >= 400;
    record('/fetchSubaccountAuthToken is NOT directly callable', blocked,
      `status=${privRes.status}`);

    // Extra safety: verify no authToken leaked in the raw body even on error
    const leaked = privRes.body && /authToken/i.test(privRes.body) && /[a-f0-9]{32}/.test(privRes.body);
    record('/fetchSubaccountAuthToken direct response contains NO auth token', !leaked,
      leaked ? `body=${privRes.body.slice(0, 200)}` : '');
  } catch (err) {
    record('/fetchSubaccountAuthToken is NOT directly callable', false, err.message);
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
