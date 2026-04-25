/**
 * Test wrapper: /test/getTwilioCredentials
 *
 * Public endpoint that verifies the private `getTwilioCredentials` helper
 * works correctly. Does NOT leak the auth token — only confirms whether
 * one was obtained and reports which account SID was resolved.
 */

exports.handler = async function (context, event, callback) {
  const cors = require(Runtime.getFunctions()['utilities/cors-response'].path);
  const { getTwilioCredentials } = require(
    Runtime.getFunctions()['getTwilioCredentials'].path
  );

  const result = await getTwilioCredentials(context, event.subaccountSid);

  if (!result.ok) {
    return callback(null, cors.response({ ok: false, error: result.error }));
  }

  return callback(null, cors.response({
    ok: true,
    accountSid: result.data.accountSid,
    usingParent: result.data.usingParent,
    hasAuthToken: typeof result.data.authToken === 'string' && result.data.authToken.length > 0
  }));
};
