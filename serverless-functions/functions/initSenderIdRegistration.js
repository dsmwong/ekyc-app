const twilio_version = require('twilio/package.json').version;
const axios = require('axios');

exports.handler = async function(context, event, callback) {

  let cors = require(Runtime.getFunctions()['utilities/cors-response'].path);

  console.log(`Entered ${context.PATH} node version ${process.version} twilio version ${twilio_version}`);

  const { getTwilioCredentials } = require(Runtime.getFunctions()['getTwilioCredentials'].path);
  const credsResult = await getTwilioCredentials(context, event.subaccountSid);
  if (!credsResult.ok) {
    return callback(null, cors.response({ error: credsResult.error }));
  }
  const { accountSid, authToken, usingParent } = credsResult.data;
  console.log(`Using ${usingParent ? 'parent' : 'subaccount'} account: ${accountSid}`);

  const {
    friendly_name,
    status_callback_url,
    theme_set_id,
    RegistrationId,
    // Sender ID
    sender_id,
    proof_of_sender_id,
    // Business
    business_identity,
    is_subassigned,
    headquarters_country,
    business_name,
    business_type,
    business_registration_number,
    business_website,
    business_registration_country,
    registration_authority,
    telephone_number,
    trade_name,
    // Use Case
    use_case_category,
    use_case_description,
    sample_message,
    average_message_volume_per_month,
    // Authorized Representative
    auth_rep_first_name,
    auth_rep_last_name,
    auth_rep_email,
    auth_rep_phone_number,
    // Officer
    officer_first_name,
    officer_last_name,
    officer_email,
    // Business Address
    street,
    street_secondary,
    city,
    region,
    postal_code,
    iso_country
  } = event;

  // If RegistrationId exists, create a new embedded session on the existing registration
  if (RegistrationId) {
    const embeddedSessionUrl = `https://numbers.twilio.com/v1/SenderIdRegistrations/${RegistrationId}/EmbeddedSessions`;
    console.log(`Creating new embedded session: ${embeddedSessionUrl}`);

    const sessionParams = {};
    if (theme_set_id) {
      sessionParams.themeSetId = theme_set_id;
    }

    try {
      const response = await axios.post(embeddedSessionUrl, sessionParams, {
        auth: {
          username: accountSid,
          password: authToken
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return callback(null, cors.response(response.data));
    } catch (error) {
      console.error(`Error creating embedded session: ${error.message}`);
      const details = error.response ? error.response.data : error.message;
      return callback(null, cors.response({error: 'Failed to create embedded session', details: details}));
    }
  }

  // New registration flow
  // Validate required fields
  if (!sender_id) {
    return callback(null, cors.response({error: 'sender_id is required'}));
  }

  if (!friendly_name) {
    return callback(null, cors.response({error: 'friendly_name is required'}));
  }

  if (!business_identity) {
    return callback(null, cors.response({error: 'business_identity is required (DIRECT or ISV)'}));
  }

  if (!is_subassigned) {
    return callback(null, cors.response({error: 'is_subassigned is required (YES or NO)'}));
  }

  if (!headquarters_country) {
    return callback(null, cors.response({error: 'headquarters_country is required (2-char ISO country code)'}));
  }

  if (!use_case_category) {
    return callback(null, cors.response({error: 'use_case_category is required (PROMOTIONAL or TRANSACTIONAL)'}));
  }

  // Build the data object, only including fields that are provided
  const data = {
    alphanumericSender: {
      senderId: sender_id
    },
    business: {
      businessIdentity: business_identity,
      isSubassigned: is_subassigned,
      headquartersCountry: headquarters_country
    },
    useCase: {
      category: use_case_category
    }
  };

  // Optional sender ID fields
  if (proof_of_sender_id) data.alphanumericSender.proofOfSenderId = proof_of_sender_id;

  // Optional business fields
  if (business_name) data.business.businessName = business_name;
  if (business_type) data.business.businessType = business_type;
  if (business_registration_number) data.business.businessRegistrationNumber = business_registration_number;
  if (business_website) data.business.businessWebsite = business_website;
  if (business_registration_country) data.business.businessRegistrationCountry = business_registration_country;
  if (registration_authority) data.business.registrationAuthority = registration_authority;
  if (telephone_number) data.business.telephoneNumber = telephone_number;
  if (trade_name) data.business.tradeName = trade_name;

  // Optional use case fields
  if (use_case_description) data.useCase.useCaseDescription = use_case_description;
  if (sample_message) data.useCase.sampleMessage = sample_message;
  if (average_message_volume_per_month) data.useCase.averageMessageVolumePerMonth = average_message_volume_per_month;

  // Optional authorized representative
  if (auth_rep_first_name || auth_rep_last_name || auth_rep_email || auth_rep_phone_number) {
    data.authorizedRepresentative = {};
    if (auth_rep_first_name) data.authorizedRepresentative.firstName = auth_rep_first_name;
    if (auth_rep_last_name) data.authorizedRepresentative.lastName = auth_rep_last_name;
    if (auth_rep_email) data.authorizedRepresentative.email = auth_rep_email;
    if (auth_rep_phone_number) data.authorizedRepresentative.phoneNumber = auth_rep_phone_number;
  }

  // Optional officer
  if (officer_first_name || officer_last_name || officer_email) {
    data.officer = {};
    if (officer_first_name) data.officer.firstName = officer_first_name;
    if (officer_last_name) data.officer.lastName = officer_last_name;
    if (officer_email) data.officer.email = officer_email;
  }

  // Optional business address
  if (street || city || region || postal_code || iso_country) {
    data.businessAddress = {};
    if (street) data.businessAddress.street = street;
    if (street_secondary) data.businessAddress.streetSecondary = street_secondary;
    if (city) data.businessAddress.city = city;
    if (region) data.businessAddress.region = region;
    if (postal_code) data.businessAddress.postalCode = postal_code;
    if (iso_country) data.businessAddress.isoCountry = iso_country;
  }

  const params = {
    regulationId: "RNa8ade60e2a607e62a802f4e6facc887a",
    regulationVersion: 1,
    friendlyName: friendly_name,
    data: data
  };

  // Optional top-level fields
  if (context.NOTIFICATION_EMAIL) params.statusNotificationEmail = context.NOTIFICATION_EMAIL;
  if (status_callback_url) params.statusCallbackUrl = status_callback_url;
  if (theme_set_id) params.themeSetId = theme_set_id;

  const registrationUrl = 'https://numbers.twilio.com/v1/SenderIdRegistrations';

  console.log(`Creating new sender ID registration: ${registrationUrl}`);
  console.log(`params: ${JSON.stringify(params, null, 2)}`);

  try {
    const response = await axios.post(registrationUrl, params, {
      auth: {
        username: accountSid,
        password: authToken
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return callback(null, cors.response(response.data));
  } catch (error) {
    console.error(`Error creating sender ID registration: ${error.message}`);
    const details = error.response ? error.response.data : error.message;
    return callback(null, cors.response({error: 'Failed to create sender ID registration', details: details}));
  }
};
