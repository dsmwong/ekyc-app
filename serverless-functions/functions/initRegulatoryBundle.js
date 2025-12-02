const twilio_version = require('twilio/package.json').version;
const axios = require('axios');

function extractComplianceParameters(event) {
  const {
    RegulationSid,
    ComplianceRegulationSubType,
    ComplianceRegulationCountry,
    ComplianceRegulationEndUserType
  } = event;

  // If RegulationSid exists, return it as URL parameter
  if (RegulationSid) {
    return `RegulationSid=${encodeURIComponent(RegulationSid)}`;
  }

  // If RegulationSid is not supplied, all three parameters are required
  if (!ComplianceRegulationSubType || !ComplianceRegulationCountry || !ComplianceRegulationEndUserType) {
    throw new Error(
      'When RegulationSid is not provided, ComplianceRegulationSubType, ' +
      'ComplianceRegulationCountry, and ComplianceRegulationEndUserType are all required'
    );
  }

  // Valid phone number types
  const VALID_PHONE_TYPES = [
    'LOCAL_PHONE_NUMBER',
    'MOBILE_PHONE_NUMBER',
    'NATIONAL_PHONE_NUMBER',
    'TOLLFREE_PHONE_NUMBER'
  ];

  // Valid end user types
  const VALID_END_USER_TYPES = ['BUSINESS', 'INDIVIDUAL'];

  // Validate ComplianceRegulationSubType
  if (!VALID_PHONE_TYPES.includes(ComplianceRegulationSubType)) {
    throw new Error(
      `Invalid ComplianceRegulationSubType: ${ComplianceRegulationSubType}. ` +
      `Must be one of: ${VALID_PHONE_TYPES.join(', ')}`
    );
  }

  // Validate ComplianceRegulationEndUserType
  if (!VALID_END_USER_TYPES.includes(ComplianceRegulationEndUserType)) {
    throw new Error(
      `Invalid ComplianceRegulationEndUserType: ${ComplianceRegulationEndUserType}. ` +
      `Must be either BUSINESS or INDIVIDUAL`
    );
  }

  // Validate ComplianceRegulationCountry (2-character ISO country code)
  if (!/^[A-Z]{2}$/.test(ComplianceRegulationCountry)) {
    throw new Error(
      `Invalid ComplianceRegulationCountry: ${ComplianceRegulationCountry}. ` +
      `Must be a valid 2-character ISO country code`
    );
  }

  // Build URL parameter string with all three parameters
  return [
    `ComplianceRegulationSubType=${encodeURIComponent(ComplianceRegulationSubType)}`,
    `ComplianceRegulationCountry=${encodeURIComponent(ComplianceRegulationCountry)}`,
    `ComplianceRegulationEndUserType=${encodeURIComponent(ComplianceRegulationEndUserType)}`
  ].join('&');
}

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
    ComplianceRegulationSubType,
    ComplianceRegulationCountry,
    ComplianceRegulationEndUserType,
    RegistrationId
  } = event;

  // Validate and extract compliance parameters
  let complianceParams;

  try {
    complianceParams = extractComplianceParameters(event);
    console.log(`Compliance parameters: ${complianceParams}`);
  } catch (error) {
    console.error(`Compliance parameter validation failed: ${error.message}`);
    return callback(null, cors.response({error: error.message}));
  }

  const existingRegistrationId = RegistrationId ? RegistrationId + '/' : '';
  const embeddableProduct = `Registration/${existingRegistrationId}RegulatoryCompliance`;

  const complianceInquiriesUrl = `https://trusthub.twilio.com/v3/ComplianceRegistrations/${existingRegistrationId}InitializeInquiry?${complianceParams}`;

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
  // callback(null, cors.response(params));
};