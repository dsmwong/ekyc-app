#!/usr/bin/env node

/**
 * Delete TrustHub bundles listed in a file
 *
 * Usage:
 *   node scripts/delete-bundles-from-list.js <bundles-list-file>
 *   node scripts/delete-bundles-from-list.js <bundles-list-file> --silent
 *
 * File format: one Bundle SID per line (BU followed by 32 hex characters)
 *
 * Default behaviour: shows Friendly Name + Status and asks [y/N] before each deletion.
 * With --silent: deletes all bundles without prompting.
 */

const path = require('path');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const ACCOUNT_SID = process.env.ACCOUNT_SID;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!ACCOUNT_SID || !AUTH_TOKEN) {
  console.error('Error: ACCOUNT_SID and AUTH_TOKEN must be set in .env or environment.');
  process.exit(1);
}

const axios = require('axios');
const auth = { username: ACCOUNT_SID, password: AUTH_TOKEN };
const TRUSTHUB_BASE = 'https://trusthub.twilio.com/v1/TrustProducts';

async function fetchBundle(bundleSid) {
  try {
    const response = await axios.get(`${TRUSTHUB_BASE}/${bundleSid}`, { auth });
    return { ok: true, bundle: response.data };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { ok: false, reason: 'not found' };
    }
    const status = error.response ? error.response.status : 'N/A';
    return { ok: false, reason: `HTTP ${status}` };
  }
}

async function fetchSenderId(bundleSid) {
  try {
    const assignmentsResponse = await axios.get(
      `${TRUSTHUB_BASE}/${bundleSid}/EntityAssignments`, { auth }
    );

    for (const entity of assignmentsResponse.data.results) {
      // Try EndUser first, then SupportingDocument
      for (const endpoint of ['EndUsers', 'SupportingDocuments']) {
        try {
          const r = await axios.get(
            `https://trusthub.twilio.com/v1/${endpoint}/${entity.object_sid}`, { auth }
          );
          if (r.data.attributes && r.data.attributes.sender_id) {
            return r.data.attributes.sender_id;
          }
        } catch {
          // try next endpoint
        }
      }
    }
  } catch {
    // ignore errors — sender ID display is best-effort
  }
  return null;
}

async function deleteBundle(bundleSid) {
  try {
    await axios.delete(`${TRUSTHUB_BASE}/${bundleSid}`, { auth });
    return { ok: true };
  } catch (error) {
    const status = error.response ? error.response.status : 'N/A';
    const message = error.response ? JSON.stringify(error.response.data) : error.message;
    return { ok: false, reason: `HTTP ${status} — ${message}` };
  }
}

function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function readBundleSids(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^BU[0-9a-f]{32}$/.test(line));
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node scripts/delete-bundles-from-list.js <bundles-list-file> [--silent] [--dry-run]

Arguments:
  <bundles-list-file>   Path to a file containing one Bundle SID per line
  --silent              Delete all without prompting for confirmation
  --dry-run             Show planned actions without deleting anything

Example:
  node scripts/delete-bundles-from-list.js ../bundles-to-delete.list
  node scripts/delete-bundles-from-list.js ../bundles-to-delete.list --silent
  node scripts/delete-bundles-from-list.js ../bundles-to-delete.list --dry-run
`);
    process.exit(0);
  }

  const silent = args.includes('--silent');
  const dryRun = args.includes('--dry-run');
  const inputFile = args.find(a => !a.startsWith('--'));

  if (!inputFile) {
    console.error('Error: No input file specified.');
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  const bundleSids = readBundleSids(inputFile);

  if (bundleSids.length === 0) {
    console.log(`No valid Bundle SIDs found in ${inputFile}`);
    process.exit(0);
  }

  if (dryRun) {
    console.log('*** DRY RUN — no deletions will be performed ***\n');
  }

  console.log(`Found ${bundleSids.length} bundle(s) in ${inputFile}\n`);

  let deleted = 0;
  let skipped = 0;
  let failed = 0;

  for (const sid of bundleSids) {
    console.log(`Bundle: ${sid}`);

    // Fetch details
    const { ok, bundle, reason } = await fetchBundle(sid);

    if (!ok) {
      console.log(`  Status: ${reason === 'not found' ? 'Not found (already deleted?)' : `Failed to fetch — ${reason}`}`);
      console.log();
      skipped++;
      continue;
    }

    const senderId = await fetchSenderId(sid);

    console.log(`  Friendly Name: ${bundle.friendly_name}`);
    console.log(`  Sender ID:     ${senderId || '(not found)'}`);
    console.log(`  Status:        ${bundle.status}`);

    if (dryRun) {
      console.log('  Action: Would delete this bundle');
      skipped++;
      console.log();
      continue;
    }

    if (!silent) {
      const answer = await prompt('  Delete this bundle? [y/N] ');
      if (!/^[Yy]$/.test(answer)) {
        console.log('  Skipped.');
        console.log();
        skipped++;
        continue;
      }
    }

    const result = await deleteBundle(sid);
    if (result.ok) {
      console.log('  ✓ Deleted');
      deleted++;
    } else {
      console.log(`  ✗ Failed: ${result.reason}`);
      failed++;
    }
    console.log();
  }

  console.log('-------------------------------------------');
  console.log(`Done.  Deleted: ${deleted}  |  Skipped: ${skipped}  |  Failed: ${failed}`);
}

main().catch(error => {
  console.error('Unexpected error:', error.message);
  process.exit(1);
});