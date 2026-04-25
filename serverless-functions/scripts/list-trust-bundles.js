#!/usr/bin/env node

/**
 * List TrustProducts (Trust Bundles) with various filtering options
 *
 * Usage:
 *   node scripts/list-trust-bundles.js                    # List all bundles
 *   node scripts/list-trust-bundles.js --status draft     # Filter by status
 *   node scripts/list-trust-bundles.js --regulation RNxxx # Filter by regulation ID
 *   node scripts/list-trust-bundles.js --au-sender-id    # Shortcut for AU Sender ID regulation
 *   node scripts/list-trust-bundles.js --detailed         # Show detailed table with Policy SIDs
 *
 * Options can be combined:
 *   node scripts/list-trust-bundles.js --status draft --regulation RNa8ade60e2a607e62a802f4e6facc887a
 */

const path = require('path');
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
const AU_SENDER_ID_REGULATION = 'RNa8ade60e2a607e62a802f4e6facc887a';

async function listBundles(options = {}) {
  const { statusFilter, regulationFilter, detailed } = options;

  console.log('\nFetching TrustProducts...');
  if (statusFilter) console.log(`  Status filter: ${statusFilter}`);
  if (regulationFilter) console.log(`  Regulation filter: ${regulationFilter}`);
  console.log();

  let url = TRUSTHUB_BASE + '?PageSize=50';
  if (statusFilter) {
    url += `&Status=${statusFilter}`;
  }

  const allBundles = [];
  let pageCount = 0;

  while (url) {
    pageCount++;
    const response = await axios.get(url, { auth });
    const body = response.data;
    allBundles.push(...body.results);
    url = body.meta && body.meta.next_page_url ? body.meta.next_page_url : null;
  }

  // Apply regulation filter if specified
  let filteredBundles = allBundles;
  if (regulationFilter) {
    filteredBundles = allBundles.filter(b => b.policy_sid === regulationFilter);
  }

  if (filteredBundles.length === 0) {
    let message = 'No TrustProducts found';
    if (statusFilter) message += ` with status "${statusFilter}"`;
    if (regulationFilter) message += ` with regulation "${regulationFilter}"`;
    console.log(message + '.');
    return;
  }

  console.log(`Found ${filteredBundles.length} TrustProduct(s)\n`);

  if (detailed) {
    // Detailed table format with Policy/Regulation SID
    const col1 = 'Friendly Name';
    const col2 = 'Bundle SID';
    const col3 = 'Status';
    const col4 = 'Policy/Regulation SID';

    console.log(col1.padEnd(50) + ' | ' + col2.padEnd(36) + ' | ' + col3.padEnd(15) + ' | ' + col4);
    console.log('-'.repeat(50) + '-+-' + '-'.repeat(36) + '-+-' + '-'.repeat(15) + '-+-' + '-'.repeat(36));

    for (const bundle of filteredBundles) {
      const friendlyName = (bundle.friendly_name || '').substring(0, 49).padEnd(50);
      const sid = bundle.sid.padEnd(36);
      const status = bundle.status.padEnd(15);
      const policySid = bundle.policy_sid || 'N/A';
      console.log(`${friendlyName} | ${sid} | ${status} | ${policySid}`);
    }
  } else {
    // Simple format
    console.log('SID                                  Status          Friendly Name');
    console.log('-'.repeat(90));
    for (const bundle of filteredBundles) {
      const sid = bundle.sid.padEnd(36);
      const status = bundle.status.padEnd(15);
      console.log(`${sid} ${status} ${bundle.friendly_name}`);
    }
  }
  console.log();

  // Show summary by regulation if we're showing all bundles
  if (!regulationFilter && filteredBundles.length > 0) {
    const byPolicy = {};
    for (const bundle of filteredBundles) {
      const policy = bundle.policy_sid || 'None';
      byPolicy[policy] = (byPolicy[policy] || 0) + 1;
    }

    console.log('Summary by Policy/Regulation SID:');
    console.log('-'.repeat(60));
    for (const [policy, count] of Object.entries(byPolicy)) {
      console.log(`${policy}: ${count} bundle(s)`);
    }
    console.log();
  }
}

function parseArgs(args) {
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--status' && args[i + 1]) {
      options.statusFilter = args[i + 1];
      i++;
    } else if (args[i] === '--regulation' && args[i + 1]) {
      options.regulationFilter = args[i + 1];
      i++;
    } else if (args[i] === '--au-sender-id') {
      options.regulationFilter = AU_SENDER_ID_REGULATION;
    } else if (args[i] === '--detailed') {
      options.detailed = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Usage: node scripts/list-trust-bundles.js [OPTIONS]

Options:
  --status <status>      Filter by status (draft, pending-review, in-review,
                         twilio-approved, twilio-rejected)
  --regulation <RNxxx>   Filter by regulation/policy SID
  --au-sender-id         Shortcut for AU Sender ID regulation
                         (RNa8ade60e2a607e62a802f4e6facc887a)
  --detailed             Show detailed table with Policy/Regulation SIDs
  --help, -h             Show this help message

Examples:
  node scripts/list-trust-bundles.js
  node scripts/list-trust-bundles.js --status draft
  node scripts/list-trust-bundles.js --regulation RNa282dd7f3dbef8586501ca2e045e764c
  node scripts/list-trust-bundles.js --au-sender-id --detailed
  node scripts/list-trust-bundles.js --status twilio-approved --regulation RNa8ade60e2a607e62a802f4e6facc887a
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Default: list all bundles
    await listBundles();
  } else {
    const options = parseArgs(args);
    await listBundles(options);
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});