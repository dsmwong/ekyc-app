const twilio_version = require('twilio/package.json').version;

exports.handler = async function(context, event, callback) {

  let cors = require(Runtime.getFunctions()['utilities/cors-response'].path);

  console.log(`Entered ${context.PATH} node version ${process.version} twilio version ${twilio_version}`);

  const client = context.getTwilioClient();

  const {
    countryCode,
    endUserType,
    numberType
  } = event;

  // Validate required parameters
  if (!countryCode || !endUserType || !numberType) {
    console.error('Missing required parameters');
    return callback(null, cors.response({
      status: 'error',
      message: 'Missing required parameters: countryCode, endUserType, and numberType are all required'
    }));
  }

  // Validate countryCode format (2-character ISO code)
  if (!/^[A-Z]{2}$/i.test(countryCode)) {
    console.error(`Invalid countryCode format: ${countryCode}`);
    return callback(null, cors.response({
      status: 'error',
      message: 'Invalid countryCode: must be a 2-character ISO country code'
    }));
  }

  try {
    // Get the Sync Service SID from environment
    const syncServiceSid = context.SYNC_SERVICE_SID;

    if (!syncServiceSid) {
      console.error('SYNC_SERVICE_SID not configured in environment');
      return callback(null, cors.response({
        status: 'error',
        message: 'Sync Service not configured'
      }));
    }

    console.log(`Querying Sync Map for country: ${countryCode}, endUserType: ${endUserType}, numberType: ${numberType}`);

    // Query the Sync Map using the unique name
    const syncMap = await client.sync.v1
      .services(syncServiceSid)
      .syncMaps('regulationsMap')
      .syncMapItems(countryCode.toUpperCase())
      .fetch();

    console.log(`Retrieved data for country: ${countryCode}`);

    // Navigate the nested structure
    const countryData = syncMap.data;

    if (countryData &&
        countryData[endUserType] &&
        countryData[endUserType][numberType]) {

      const regulation = countryData[endUserType][numberType];

      console.log(`Regulation found: ${regulation['Friendly Name']}`);

      return callback(null, cors.response({
        status: 'ok',
        friendlyName: regulation['Friendly Name'],
        sid: regulation['Sid']
      }));
    } else {
      console.log(`No regulation found for the specified combination`);
      return callback(null, cors.response({
        status: 'not found'
      }));
    }

  } catch (error) {
    console.error(`Error querying Sync Map: ${error.message}`);

    // Check if it's a "not found" error (404)
    if (error.status === 404 || error.code === 20404) {
      console.log(`Country code ${countryCode} not found in Sync Map`);
      return callback(null, cors.response({
        status: 'not found'
      }));
    }

    // Other errors
    return callback(null, cors.response({
      status: 'error',
      message: 'Failed to query regulations',
      details: error.message
    }));
  }
};
