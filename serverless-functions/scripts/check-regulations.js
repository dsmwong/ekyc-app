#!/usr/bin/env node

/**
 * Compare supported_regulations.json against the live list from Twilio.
 *
 * Fetches all regulations from
 *   https://numbers.twilio.com/v2/RegulatoryCompliance/Regulations
 * normalizes them into the same shape as supported_regulations.json, writes
 * the result to a temporary file (supported_regulations.new.json by default),
 * and prints a summary of the difference.
 *
 * Does NOT modify supported_regulations.json. Review the temp file and copy
 * it over manually if you're happy with the changes.
 *
 * Usage:
 *   node scripts/check-regulations.js
 *   node scripts/check-regulations.js --verbose
 *   node scripts/check-regulations.js --country AU
 *   node scripts/check-regulations.js --out /tmp/regs.json
 */

const path = require('path');
const fs = require('fs');
const https = require('https');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const ACCOUNT_SID = process.env.ACCOUNT_SID;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!ACCOUNT_SID || !AUTH_TOKEN) {
  console.error('Error: ACCOUNT_SID and AUTH_TOKEN must be set in .env or environment.');
  process.exit(1);
}

const REGULATIONS_FILE = path.resolve(__dirname, '..', 'supported_regulations.json');
const DEFAULT_OUTPUT = path.resolve(__dirname, '..', 'supported_regulations.new.json');
const DEFAULT_RAW_OUTPUT = path.resolve(__dirname, '..', 'supported_regulations.raw.json');
const DEFAULT_ADDITIONS_OUTPUT = path.resolve(__dirname, '..', 'supported_regulations.additions.txt');
const API_BASE = 'https://numbers.twilio.com/v2/RegulatoryCompliance/Regulations';

// API uses lowercase/kebab-case; the JSON uses Title Case with spaces.
const NUMBER_TYPE_TO_JSON = {
  'local': 'Local',
  'mobile': 'Mobile',
  'national': 'National',
  'toll-free': 'Toll Free'
};
const END_USER_TYPE_TO_JSON = {
  'business': 'Business',
  'individual': 'Individual'
};

// Country codes from the API that aren't real countries — filtered out of the
// tree but still preserved in the raw dump for inspection.
// - "" (empty): the Primary Customer Profile regulation
// - "AA": ISO 3166 "User-assigned" — used as a Twilio test/sentinel code
const SKIP_COUNTRY_CODES = new Set(['', 'AA']);

// A regulation with requirements.end_user and requirements.supporting_document
// both empty is an API placeholder — no compliance docs are actually required.
// These are excluded from the filtered tree but preserved in the raw dump.
function hasMeaningfulRequirements(reg) {
  const req = reg && reg.requirements;
  if (!req || typeof req !== 'object') return false;
  for (const key of Object.keys(req)) {
    const arr = req[key];
    if (Array.isArray(arr) && arr.length > 0) return true;
  }
  return false;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    verbose: false,
    country: null,
    out: DEFAULT_OUTPUT,
    rawOut: DEFAULT_RAW_OUTPUT,
    additionsOut: DEFAULT_ADDITIONS_OUTPUT
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--verbose' || args[i] === '-v') opts.verbose = true;
    else if (args[i] === '--country' && args[i + 1]) { opts.country = args[++i].toUpperCase(); }
    else if (args[i] === '--out' && args[i + 1]) { opts.out = path.resolve(args[++i]); }
    else if (args[i] === '--raw-out' && args[i + 1]) { opts.rawOut = path.resolve(args[++i]); }
    else if (args[i] === '--additions-out' && args[i + 1]) { opts.additionsOut = path.resolve(args[++i]); }
    else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: node scripts/check-regulations.js [OPTIONS]

Options:
  --verbose, -v           Show each added/removed/changed row
  --country <CC>          Only compare regulations for this 2-char country code
  --out <path>            Path for the filtered new JSON (default: ${DEFAULT_OUTPUT})
  --raw-out <path>        Path for the raw API dump (default: ${DEFAULT_RAW_OUTPUT})
  --additions-out <path>  Path for the one-line-per-entry additions file
                          (default: ${DEFAULT_ADDITIONS_OUTPUT})
  --help, -h              Show this help
`);
      process.exit(0);
    }
    else {
      console.error(`Unknown option: ${args[i]}`);
      process.exit(1);
    }
  }
  return opts;
}

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
    const req = https.get(url, { headers: { Authorization: `Basic ${auth}` } }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
        }
        try { resolve(JSON.parse(body)); }
        catch (err) { reject(new Error(`Invalid JSON: ${err.message}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error(`Timeout fetching ${url}`)));
  });
}

async function fetchAllRegulations() {
  let url = `${API_BASE}?PageSize=200`;
  const results = [];
  let pageCount = 0;
  while (url) {
    pageCount++;
    process.stdout.write(`  Page ${pageCount}…\r`);
    const body = await httpGetJson(url);
    if (Array.isArray(body.results)) results.push(...body.results);
    url = body.meta && body.meta.next_page_url ? body.meta.next_page_url : null;
  }
  process.stdout.write(`  Fetched ${pageCount} page(s).          \n`);
  return results;
}

function buildJsonTree(regulations, countryFilter) {
  const tree = {};
  const skipped = { nonCountry: [], unknownType: [], emptyRequirements: [] };

  for (const reg of regulations) {
    const country = reg.iso_country;
    if (countryFilter && country !== countryFilter) continue;

    if (SKIP_COUNTRY_CODES.has(country)) {
      skipped.nonCountry.push(reg);
      continue;
    }

    if (!hasMeaningfulRequirements(reg)) {
      skipped.emptyRequirements.push(reg);
      continue;
    }

    const endUser = END_USER_TYPE_TO_JSON[reg.end_user_type];
    const numberType = NUMBER_TYPE_TO_JSON[reg.number_type];
    if (!endUser || !numberType) {
      skipped.unknownType.push(reg);
      continue;
    }

    if (!tree[country]) tree[country] = {};
    if (!tree[country][endUser]) tree[country][endUser] = {};
    tree[country][endUser][numberType] = {
      'Friendly Name': reg.friendly_name,
      'Sid': reg.sid
    };
  }

  // Sort keys for deterministic output (matches current file style).
  return { tree: sortTree(tree), skipped };
}

function sortTree(obj) {
  if (Array.isArray(obj) || obj === null || typeof obj !== 'object') return obj;
  const sorted = {};
  for (const k of Object.keys(obj).sort()) sorted[k] = sortTree(obj[k]);
  return sorted;
}

function flattenTree(tree) {
  // Returns array of { country, endUserType, numberType, friendlyName, sid }
  const rows = [];
  for (const [country, endUsers] of Object.entries(tree)) {
    for (const [endUser, numberTypes] of Object.entries(endUsers)) {
      for (const [numberType, info] of Object.entries(numberTypes)) {
        rows.push({
          country,
          endUserType: endUser,
          numberType,
          friendlyName: info['Friendly Name'],
          sid: info.Sid
        });
      }
    }
  }
  return rows;
}

function keyFor(row) {
  return `${row.country}/${row.endUserType}/${row.numberType}`;
}

function diff(currentRows, newRows) {
  const currentMap = new Map(currentRows.map(r => [keyFor(r), r]));
  const newMap = new Map(newRows.map(r => [keyFor(r), r]));

  const added = [];
  const removed = [];
  const sidChanged = [];
  const nameChanged = [];
  let unchanged = 0;

  for (const [key, nRow] of newMap) {
    const cRow = currentMap.get(key);
    if (!cRow) {
      added.push(nRow);
      continue;
    }
    if (cRow.sid !== nRow.sid) {
      sidChanged.push({ before: cRow, after: nRow });
    } else if (cRow.friendlyName !== nRow.friendlyName) {
      nameChanged.push({ before: cRow, after: nRow });
    } else {
      unchanged++;
    }
  }
  for (const [key, cRow] of currentMap) {
    if (!newMap.has(key)) removed.push(cRow);
  }

  return { added, removed, sidChanged, nameChanged, unchanged };
}

function formatRow(r) {
  return `${r.country.padEnd(3)} / ${r.endUserType.padEnd(10)} / ${r.numberType.padEnd(9)}  ${r.sid}  "${r.friendlyName}"`;
}

function printSummary(d, verbose) {
  console.log('\nDiff vs supported_regulations.json:');
  console.log(`  + ADDED:              ${d.added.length}`);
  console.log(`  - REMOVED:            ${d.removed.length}`);
  console.log(`  ~ SID CHANGED:        ${d.sidChanged.length}`);
  console.log(`  ≈ FRIENDLY NAME:      ${d.nameChanged.length}`);
  console.log(`  = UNCHANGED:          ${d.unchanged}`);

  if (verbose) {
    if (d.added.length) {
      console.log('\n  + ADDED:');
      d.added.sort((a, b) => keyFor(a).localeCompare(keyFor(b))).forEach(r => console.log('      ' + formatRow(r)));
    }
    if (d.removed.length) {
      console.log('\n  - REMOVED:');
      d.removed.sort((a, b) => keyFor(a).localeCompare(keyFor(b))).forEach(r => console.log('      ' + formatRow(r)));
    }
    if (d.sidChanged.length) {
      console.log('\n  ~ SID CHANGED:');
      d.sidChanged.sort((a, b) => keyFor(a.before).localeCompare(keyFor(b.before))).forEach(c => {
        console.log('      ' + formatRow(c.before));
        console.log('   →  ' + formatRow(c.after));
      });
    }
    if (d.nameChanged.length) {
      console.log('\n  ≈ FRIENDLY NAME CHANGED:');
      d.nameChanged.sort((a, b) => keyFor(a.before).localeCompare(keyFor(b.before))).forEach(c => {
        console.log(`      ${c.before.country} / ${c.before.endUserType} / ${c.before.numberType}  ${c.before.sid}`);
        console.log(`         "${c.before.friendlyName}" → "${c.after.friendlyName}"`);
      });
    }
  } else if (d.added.length + d.removed.length + d.sidChanged.length + d.nameChanged.length > 0) {
    console.log('\nRun with --verbose to see each row.');
  }
}

function filterTreeByCountry(tree, country) {
  if (!country) return tree;
  return tree[country] ? { [country]: tree[country] } : {};
}

async function main() {
  const opts = parseArgs();

  if (!fs.existsSync(REGULATIONS_FILE)) {
    console.error(`Error: ${REGULATIONS_FILE} not found.`);
    process.exit(1);
  }

  console.log('Fetching live regulations from Twilio…');
  const liveRegulations = await fetchAllRegulations();
  console.log(`Fetched ${liveRegulations.length} regulation(s) across ${new Set(liveRegulations.map(r => r.iso_country)).size} ISO code(s).`);

  // Persist the full raw API response so you can inspect skipped entries later.
  fs.writeFileSync(
    opts.rawOut,
    JSON.stringify({
      fetchedAt: new Date().toISOString(),
      count: liveRegulations.length,
      results: liveRegulations
    }, null, 2) + '\n',
    'utf-8'
  );
  console.log(`Raw API dump written: ${opts.rawOut}`);

  const { tree: newTree, skipped } = buildJsonTree(liveRegulations, opts.country);
  const currentTreeFull = JSON.parse(fs.readFileSync(REGULATIONS_FILE, 'utf-8'));
  const currentTree = filterTreeByCountry(currentTreeFull, opts.country);

  // Write filtered temp file (country tree only — mirrors supported_regulations.json shape)
  fs.writeFileSync(opts.out, JSON.stringify(newTree, null, 2) + '\n', 'utf-8');
  console.log(`Filtered temp file written: ${opts.out}`);
  console.log('(supported_regulations.json was NOT modified.)');

  if (skipped.nonCountry.length || skipped.unknownType.length || skipped.emptyRequirements.length) {
    console.log('\nSkipped from filtered tree (still in raw dump):');
    if (skipped.nonCountry.length) {
      const codes = [...new Set(skipped.nonCountry.map(r => `"${r.iso_country}"`))].sort();
      console.log(`  - Non-country codes: ${skipped.nonCountry.length} regulation(s) under ${codes.join(', ')}`);
    }
    if (skipped.emptyRequirements.length) {
      const countryCount = new Set(skipped.emptyRequirements.map(r => r.iso_country)).size;
      console.log(`  - Empty requirements (API placeholders): ${skipped.emptyRequirements.length} regulation(s) across ${countryCount} ISO code(s)`);
      if (opts.verbose) {
        skipped.emptyRequirements
          .sort((a, b) => `${a.iso_country}/${a.end_user_type}/${a.number_type}`.localeCompare(`${b.iso_country}/${b.end_user_type}/${b.number_type}`))
          .forEach(r => console.log(`      ${r.iso_country} / ${r.end_user_type} / ${r.number_type}  ${r.sid}  "${r.friendly_name}"`));
      }
    }
    if (skipped.unknownType.length) {
      console.log(`  - Unknown number/end-user type: ${skipped.unknownType.length} regulation(s)`);
      if (opts.verbose) {
        for (const r of skipped.unknownType) {
          console.log(`      ${r.iso_country} / ${r.end_user_type} / ${r.number_type}  ${r.sid}  "${r.friendly_name}"`);
        }
      }
    }
  }

  if (opts.country) {
    console.log(`\nNote: comparing only country ${opts.country}.`);
  }

  const currentRows = flattenTree(currentTree);
  const newRows = flattenTree(newTree);
  const d = diff(currentRows, newRows);

  // Write additions to a one-line-per-entry file.
  const sortedAdded = d.added.slice().sort((a, b) => keyFor(a).localeCompare(keyFor(b)));
  const additionsContent = sortedAdded.map(r => formatRow(r)).join('\n') + (sortedAdded.length ? '\n' : '');
  fs.writeFileSync(opts.additionsOut, additionsContent, 'utf-8');
  console.log(`Additions file written: ${opts.additionsOut} (${sortedAdded.length} entr${sortedAdded.length === 1 ? 'y' : 'ies'})`);

  printSummary(d, opts.verbose);

  const totalChanges = d.added.length + d.removed.length + d.sidChanged.length + d.nameChanged.length;
  process.exit(totalChanges === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('\nUnexpected error:', err.message);
  process.exit(1);
});
