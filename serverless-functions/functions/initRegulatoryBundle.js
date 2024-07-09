const twilio_version = require('twilio/package.json').version;

exports.handler = async function(context, event, callback) {

  let cors = require(Runtime.getFunctions()['utilities/cors-response'].path);

  console.log(`Entered ${context.PATH} node version ${process.version} twilio version ${twilio_version}`);

  const client = context.getTwilioClient();

  const {
    CountryCode,
    PhoneNumberType,
    FriendlyName,
    EndUserType,
    StatusCallbackUrl,
    ThemeSetId,
    BusinessLegalName,
    BusinessRegistrationAuthority,
    BusinessRegistrationNumber,
    BusinessWebsiteUrl,
    AddressStreet,
    AddressStreetSecondary,
    AddressCity,
    AddressSubdivision,
    AddressPostalCode,
    AddressCountryCode,
    EmergencyAddressStreet,
    EmergencyAddressStreetSecondary,
    EmergencyAddressCity,
    EmergencyAddressSubdivision,
    EmergencyAddressPostalCode,
    EmergencyAddressCountryCode,
    AuthorizedRepresentative1FirstName,
    AuthorizedRepresentative1LastName,
    AuthorizedRepresentative1Email,
    AuthorizedRepresentative1Phone,
    FirstName,
    LastName,
    IndividualPhone,
    IndividualEmail,
    DateOfBirth
  } = event;

  const existingRegistrationId = event.RegistrationId ? event.RegistrationId + '/' : '';
  const embeddableProduct = `Registration/${existingRegistrationId}RegulatoryCompliance`;
  const countryCode = CountryCode || 'GB';
  const complianceInquiriesUrl = `https://trusthub.twilio.com/v1/ComplianceInquiries/${embeddableProduct}/${countryCode}/Initialize`;

  console.log(`complianceInquiriesUrl: ${complianceInquiriesUrl}`);

  // Start Code Here
  const params = {
    PhoneNumberType,   // required
    'IsIsvEmbed': true, // required
    FriendlyName, // required
    'BusinessIdentityType': 'isv_reseller_or_partner', // required
    'IsvRegisteringForSelfOrTenant': 'my_customer', // required
    EndUserType, // required
    'NotificationEmail': context.NOTIFICATION_EMAIL, // required
    StatusCallbackUrl, // recommended
    ThemeSetId,
    BusinessLegalName,
    BusinessRegistrationAuthority,
    BusinessRegistrationNumber,
    BusinessWebsiteUrl,
    AddressStreet,
    AddressStreetSecondary,
    AddressCity,
    AddressSubdivision,
    AddressPostalCode,
    AddressCountryCode,
    EmergencyAddressStreet,
    EmergencyAddressStreetSecondary,
    EmergencyAddressCity,
    EmergencyAddressSubdivision,
    EmergencyAddressPostalCode,
    EmergencyAddressCountryCode,
    AuthorizedRepresentative1FirstName,
    AuthorizedRepresentative1LastName,
    AuthorizedRepresentative1Email,
    AuthorizedRepresentative1Phone,
    FirstName,
    LastName,
    IndividualPhone,
    IndividualEmail,
    DateOfBirth
  }

  const requiredKey = [
    "PhoneNumberType",
    "IsIsvEmbed",
    "FriendlyName",
    "BusinessIdentityType",
    "IsvRegisteringForSelfOrTenant",
    "EndUserType",
    "NotificationEmail",
  ];

  const allThere = requiredKey.every(key => (params.hasOwnProperty(key) && params[key]));
  console.log(`allThere: ${allThere}`);
  if( !allThere ) {
    console.log(`Not all required keys exist params: ${JSON.stringify(params, null, 2)}`);
    return callback(null, cors.response({error: 'Not all required keys exist'}));
  }

  console.log(`params: ${JSON.stringify(params, null, 2)}`);

  const response = await client.httpClient.request({
    method: 'POST',
    uri: complianceInquiriesUrl,
    data: params,
    username: context.ACCOUNT_SID,
    password: context.AUTH_TOKEN,
    headers: {"Content-Type":"application/x-www-form-urlencoded"},
  })

  return callback(null, cors.response(response.body));
  // callback(null, cors.response(params));
};