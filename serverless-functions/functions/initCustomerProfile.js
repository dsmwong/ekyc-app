const { log } = require('console');

const twilio_version = require('twilio/package.json').version;

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

  const twilio = require('twilio');
  const client = twilio(accountSid, authToken);
  const embeddableProduct = "Customers";

  const existingSCPId = event.CustomerProfileId ? event.CustomerProfileId + '/' : '';
  const complianceInquiriesUrl = `https://trusthub.twilio.com/v1/ComplianceInquiries/${embeddableProduct}/${existingSCPId}Initialize`;

  log(`complianceInquiriesUrl: ${complianceInquiriesUrl}`);

  // Start Code Here
  const params = {
    'PrimaryProfileSid': context.PRIMARY_CUSTOMER_PROFILE_SID,
    'NotificationEmail': context.NOTIFICATION_EMAIL,
  }

  const response = await client.httpClient.request({
    method: 'POST',
    uri: complianceInquiriesUrl,
    data: params,
    username: accountSid,
    password: authToken,
    headers: {"Content-Type":"application/x-www-form-urlencoded"},
  })

  callback(null, cors.response(response.body));
};