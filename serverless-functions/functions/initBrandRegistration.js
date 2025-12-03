const twilio_version = require('twilio/package.json').version;
const axios = require('axios');

exports.handler = async function(context, event, callback) {

  let cors = require(Runtime.getFunctions()['utilities/cors-response'].path);

  console.log(`Entered ${context.PATH} node version ${process.version} twilio version ${twilio_version}`);

  const client = context.getTwilioClient();

  const {
    friendly_name,
    status_callback_url,
    is_test,
    theme_set_id,
    RegulationSid,
    RegistrationId
  } = event;

  // Validate and extract compliance parameters
  const existingRegistrationId = RegistrationId ? RegistrationId + '/' : '';

  const complianceInquiriesUrl = `https://trusthub.twilio.com/v3/ComplianceRegistrations/${existingRegistrationId}InitializeInquiry?RegulationSid=${encodeURIComponent(RegulationSid)}`;

  console.log(`complianceInquiriesUrl: ${complianceInquiriesUrl}`);

  // Start Code Here

  // If RegistrationId exists, include parameters for updating existing registration
  const params = RegistrationId ? {} : { "data": {
      "type": "ComplianceRegistration",
      "attributes": {
        "friendly_name": friendly_name,
        "status_callback_url": status_callback_url,
        "status_notification_email": context.NOTIFICATION_EMAIL,
        "is_test": (is_test === 'true' || is_test === true).toString(),
        "theme_set_id": theme_set_id
      }
    }
  };

  if( params.data ) {

    const requiredKey = [
      "friendly_name",
      "status_notification_email"
    ];

    const allThere = requiredKey.every(key => (params.data.attributes.hasOwnProperty(key) && params.data.attributes[key]));
    if( !allThere ) {
      console.log(`Not all required keys exist params: ${JSON.stringify(params, null, 2)}`);
      return callback(null, cors.response({error: 'Not all required keys exist - requiredKey: ' + requiredKey.join(', ')}));
    }
    console.log(`allThere: ${allThere}`);
  }

  console.log(`params: ${JSON.stringify(params, null, 2)}`);

  try {
    const response = await axios.post(complianceInquiriesUrl, params, {
      auth: {
        username: context.ACCOUNT_SID,
        password: context.AUTH_TOKEN
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return callback(null, cors.response(response.data));
  } catch (error) {
    console.error(`Error making request to Compliance Inquiries API: ${error.message}`);
    return callback(null, cors.response({error: 'Failed to initialize compliance inquiry', details: error.message}));
  }

  
  // callback(null, cors.response(params));
};