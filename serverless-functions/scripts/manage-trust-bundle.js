#!/usr/bin/env node

/**
 * Fetch or delete individual TrustProducts (Trust Bundles) by SID
 *
 * Usage:
 *   node scripts/manage-trust-bundle.js fetch <BundleSid>
 *   node scripts/manage-trust-bundle.js fetch-multiple <sid1> <sid2> ...
 *   node scripts/manage-trust-bundle.js delete <BundleSid>
 *   node scripts/manage-trust-bundle.js delete <BundleSid> --force   # Skip AU validation
 *
 * The delete command validates that AU Sender ID bundles (RNa8ade60e2a607e62a802f4e6facc887a)
 * are being deleted intentionally. Use --force to skip this check.
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

// Map of known regulation SIDs to friendly names
const KNOWN_REGULATIONS = {
  'RNa8ade60e2a607e62a802f4e6facc887a': 'AU Sender ID (new)',
  'RNa282dd7f3dbef8586501ca2e045e764c': 'AU Sender ID (legacy)',
  'RN7a97559effdf62d00f4298208492a5ea': 'Customer Profile',
  'RNb0d4771c2c98518d916a3d4cd70a8f8b': 'Customer Profile'
};

async function fetchBundle(bundleSid, showEntities = true) {
  try {
    const response = await axios.get(`${TRUSTHUB_BASE}/${bundleSid}`, { auth });
    const bundle = response.data;

    console.log('\n' + '='.repeat(100));
    console.log('Bundle SID:        ' + bundle.sid);
    console.log('Friendly Name:     ' + bundle.friendly_name);
    console.log('Status:            ' + bundle.status);
    console.log('Policy/Regulation: ' + bundle.policy_sid);

    const regulationType = KNOWN_REGULATIONS[bundle.policy_sid] || 'Unknown';
    console.log('Regulation Type:   ' + regulationType);

    console.log('Email:             ' + (bundle.email || 'N/A'));
    console.log('Created:           ' + bundle.date_created);
    console.log('Updated:           ' + bundle.date_updated);

    // Try to fetch entity assignments if requested
    if (showEntities) {
      try {
        const entitiesUrl = bundle.links.trust_products_entity_assignments;
        const entitiesResponse = await axios.get(entitiesUrl, { auth });
        if (entitiesResponse.data.results && entitiesResponse.data.results.length > 0) {
          console.log('\nEntity Assignments:');
          for (const entity of entitiesResponse.data.results) {
            console.log('  - ' + entity.object_sid);
          }
        }
      } catch (err) {
        // Ignore entity fetch errors
      }
    }

    console.log('='.repeat(100));
    return bundle;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error(`\nError: Bundle ${bundleSid} not found.`);
    } else if (error.response) {
      console.error(`\nError fetching ${bundleSid} (HTTP ${error.response.status}):`);
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`\nError: ${error.message}`);
    }
    return null;
  }
}

async function fetchMultiple(bundleSids) {
  console.log(`\nFetching ${bundleSids.length} bundle(s)...`);

  const results = {
    auSenderIdNew: [],
    auSenderIdLegacy: [],
    customerProfile: [],
    other: [],
    notFound: []
  };

  for (const sid of bundleSids) {
    const bundle = await fetchBundle(sid, false); // Don't show entities for batch fetch
    if (bundle) {
      if (bundle.policy_sid === AU_SENDER_ID_REGULATION) {
        results.auSenderIdNew.push(bundle);
      } else if (bundle.policy_sid === 'RNa282dd7f3dbef8586501ca2e045e764c') {
        results.auSenderIdLegacy.push(bundle);
      } else if (bundle.policy_sid === 'RN7a97559effdf62d00f4298208492a5ea' ||
                 bundle.policy_sid === 'RNb0d4771c2c98518d916a3d4cd70a8f8b') {
        results.customerProfile.push(bundle);
      } else {
        results.other.push(bundle);
      }
    } else {
      results.notFound.push(sid);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(100));
  console.log('SUMMARY');
  console.log('='.repeat(100));

  const totalFound = results.auSenderIdNew.length + results.auSenderIdLegacy.length +
                     results.customerProfile.length + results.other.length;
  console.log(`Total fetched: ${totalFound} of ${bundleSids.length}`);

  if (results.auSenderIdNew.length > 0) {
    console.log(`\nAU Sender ID Bundles (new regulation):`);
    for (const b of results.auSenderIdNew) {
      console.log(`  ${b.sid} - ${b.friendly_name} (${b.status})`);
    }
  }

  if (results.auSenderIdLegacy.length > 0) {
    console.log(`\nAU Sender ID Bundles (legacy regulation):`);
    for (const b of results.auSenderIdLegacy) {
      console.log(`  ${b.sid} - ${b.friendly_name} (${b.status})`);
    }
  }

  if (results.customerProfile.length > 0) {
    console.log(`\nCustomer Profile Bundles:`);
    for (const b of results.customerProfile) {
      console.log(`  ${b.sid} - ${b.friendly_name} (${b.status})`);
    }
  }

  if (results.other.length > 0) {
    console.log(`\nOther Bundles:`);
    for (const b of results.other) {
      console.log(`  ${b.sid} - ${b.friendly_name} (${b.status}) [${b.policy_sid}]`);
    }
  }

  if (results.notFound.length > 0) {
    console.log(`\nNot Found:`);
    for (const sid of results.notFound) {
      console.log(`  ${sid}`);
    }
  }

  console.log('='.repeat(100));
}

async function deleteBundle(bundleSid, force = false) {
  // Validate SID format
  if (!/^BU[0-9a-f]{32}$/.test(bundleSid)) {
    console.error(`\nError: "${bundleSid}" does not look like a valid TrustProduct SID.`);
    console.error('Expected format: BUxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (BU followed by 32 hex characters)');
    return;
  }

  // First fetch to confirm it exists and show details
  const bundle = await fetchBundle(bundleSid);
  if (!bundle) {
    return;
  }

  // Safety check for AU Sender ID bundles (unless --force is used)
  if (!force && bundle.policy_sid === AU_SENDER_ID_REGULATION) {
    console.log('\n' + '!'.repeat(100));
    console.log('WARNING: This is an AU Sender ID bundle using the NEW regulation!');
    console.log('These bundles are created through the SenderIdRegistrations API.');
    console.log('They do NOT appear in standard TrustProducts list queries.');
    console.log('!'.repeat(100));
    console.log('\nTo delete this bundle, use the --force flag:');
    console.log(`  node scripts/manage-trust-bundle.js delete ${bundleSid} --force`);
    return;
  }

  console.log(`\nDeleting bundle: ${bundleSid}`);
  console.log('This action cannot be undone. Press Ctrl+C to cancel...');

  // Give user 3 seconds to cancel
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const response = await axios.delete(`${TRUSTHUB_BASE}/${bundleSid}`, { auth });
    if (response.status === 204) {
      console.log(`\n✓ Successfully deleted ${bundleSid}`);
    } else {
      console.log(`\nUnexpected response status: ${response.status}`);
    }
  } catch (error) {
    if (error.response) {
      console.error(`\nFailed to delete (HTTP ${error.response.status}):`);
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`\nError: ${error.message}`);
    }
  }
}

function showHelp() {
  console.log(`
Usage: node scripts/manage-trust-bundle.js <command> <arguments>

Commands:
  fetch <BundleSid>                   Fetch and display details of a single bundle
  fetch-multiple <sid1> <sid2> ...    Fetch multiple bundles and show summary
  delete <BundleSid> [--force]         Delete a bundle (use --force to skip AU validation)
  help                                 Show this help message

Examples:
  node scripts/manage-trust-bundle.js fetch BUa2792094b6abdc4d1180f744e22f4b8e
  node scripts/manage-trust-bundle.js fetch-multiple BUxxxx... BUyyyy... BUzzzz...
  node scripts/manage-trust-bundle.js delete BUxxxx...
  node scripts/manage-trust-bundle.js delete BUxxxx... --force

Notes:
  - Bundle SIDs start with 'BU' followed by 32 hexadecimal characters
  - AU Sender ID bundles created via SenderIdRegistrations API may not appear in list queries
  - The delete command has safety checks for AU Sender ID bundles (bypass with --force)
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  const command = args[0];

  if (command === 'fetch' && args[1]) {
    await fetchBundle(args[1]);
  } else if (command === 'fetch-multiple' && args.length > 1) {
    await fetchMultiple(args.slice(1));
  } else if (command === 'delete' && args[1]) {
    const force = args.includes('--force');
    await deleteBundle(args[1], force);
  } else {
    console.error(`\nError: Invalid command or missing arguments.`);
    console.error(`Run 'node scripts/manage-trust-bundle.js help' for usage information.`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\nUnexpected error:', error.message);
  process.exit(1);
});