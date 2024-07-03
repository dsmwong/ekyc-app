const lodash = require('lodash');
const twilio_version = require('twilio/package.json').version;

exports.handler = async function(context, event, callback) {

  console.log(`Entered ${context.PATH} node version ${process.version} twilio version ${twilio_version}`);

  let cors = require(Runtime.getFunctions()['utilities/cors-response'].path);

  const client = context.getTwilioClient();

  const filterFn = (account) => (account.sid !== account.ownerAccountSid) && (account.status === 'active');
  const properties = ['sid', 'friendlyName'];

  const accountList = await client.api.accounts.list()
  
  const subaccountList = lodash.filter(accountList, filterFn);
  const filteredAccountList = lodash.map(subaccountList, account => lodash.pick(account, properties));
  
  callback(null, cors.response(filteredAccountList));
};