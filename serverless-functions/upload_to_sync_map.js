require('dotenv').config();
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

// Parse CLI args
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { file: './supported_regulations.json' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      opts.file = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: node upload_to_sync_map.js [OPTIONS]

Options:
  --file <path>   Path to the regulations JSON file to upload
                  (default: ./supported_regulations.json)
  --help, -h      Show this help

Examples:
  node upload_to_sync_map.js
  node upload_to_sync_map.js --file ./supported_regulations.AU.json
`);
      process.exit(0);
    } else {
      console.error(`Unknown option: ${args[i]}`);
      process.exit(1);
    }
  }
  return opts;
}

const opts = parseArgs();
const regulationsPath = path.resolve(opts.file);

// Load Twilio credentials from .env file
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const syncServiceSid = process.env.SYNC_SERVICE_SID;

if (!accountSid || !authToken) {
  console.error('Error: ACCOUNT_SID and AUTH_TOKEN must be set in .env file');
  process.exit(1);
}

if (!syncServiceSid) {
  console.error('Error: SYNC_SERVICE_SID must be set in .env file');
  process.exit(1);
}

if (!fs.existsSync(regulationsPath)) {
  console.error(`Error: regulations file not found: ${regulationsPath}`);
  process.exit(1);
}

const client = twilio(accountSid, authToken);

const MAP_UNIQUE_NAME = 'regulationsMap';

async function uploadRegulations() {
  try {
    // Read the regulations JSON file
    const regulations = JSON.parse(fs.readFileSync(regulationsPath, 'utf-8'));

    console.log(`Reading regulations from: ${regulationsPath}`);
    console.log('Starting upload to Twilio Sync Map...');
    console.log(`Total countries to upload: ${Object.keys(regulations).length}`);

    let successCount = 0;
    let errorCount = 0;

    // Iterate through each country
    for (const [countryCode, countryData] of Object.entries(regulations)) {
      try {
        console.log(`Uploading ${countryCode}...`);

        // Create or update the map item
        await client.sync.v1
          .services(syncServiceSid)
          .syncMaps(MAP_UNIQUE_NAME)
          .syncMapItems
          .create({
            key: countryCode,
            data: countryData
          });

        console.log(`✓ Successfully uploaded ${countryCode}`);
        successCount++;
      } catch (error) {
        // If item already exists (409), update it instead
        if (error.status === 409 || error.code === 54208 || error.code === 54301) {
          try {
            console.log(`  ${countryCode} already exists, updating...`);
            await client.sync.v1
              .services(syncServiceSid)
              .syncMaps(MAP_UNIQUE_NAME)
              .syncMapItems(countryCode)
              .update({
                data: countryData
              });
            console.log(`✓ Successfully updated ${countryCode}`);
            successCount++;
          } catch (updateError) {
            console.error(`✗ Failed to update ${countryCode}:`, updateError.message);
            errorCount++;
          }
        } else {
          console.error(`✗ Failed to upload ${countryCode}:`, error.message);
          errorCount++;
        }
      }
    }

    console.log('\n=== Upload Complete ===');
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    console.log(`Total: ${successCount + errorCount}`);

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the upload
uploadRegulations();
