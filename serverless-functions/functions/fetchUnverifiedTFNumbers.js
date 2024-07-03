const lodash = require('lodash');
const twilio_version = require('twilio/package.json').version;

exports.handler = async function(context, event, callback) {

  console.log(`Entered ${context.PATH} node version ${process.version} twilio version ${twilio_version}`);

  let cors = require(Runtime.getFunctions()['utilities/cors-response'].path);  
  const client = context.getTwilioClient();

  // Define the pattern for toll-free numbers
  const pattern = /^\+18(00|88|77|66|55|44|33)\d{7}$/;
  const properties = ['sid', 'phoneNumber', 'friendlyName'];

  // Get the list of all incoming phone numbers
  const pnlist = await client.incomingPhoneNumbers.list();

  // Get the list of all toll-free number verifications
  const tollfreeVerifications = await client.messaging.v1.tollfreeVerifications.list();

  // get the list of verified toll-free numbers PN SIDs
  const verifiedTFPNSidList = lodash.map(tollfreeVerifications, 'tollfreePhoneNumberSid');

  // only include toll-free numbers that are not verified
  const filterFn = (pn) => pattern.test(pn.phoneNumber) && !verifiedTFPNSidList.includes(pn.sid);

  const tfNumbers = lodash.filter(pnlist, filterFn);
  const filteredPNList = lodash.map(tfNumbers, pn => lodash.pick(pn, properties));
  // Start Code Here
  
  callback(null, cors.response(filteredPNList));
};