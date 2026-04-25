/**
 * Test wrapper: /test/fetchSubaccountAuthToken
 *
 * Public endpoint that verifies the private `fetchSubaccountAuthToken` helper
 * is reachable via `Runtime.getFunctions()`. Does NOT return the raw auth
 * token — only confirms whether one was obtained.
 */

exports.handler = async function (context, event, callback) {
  const cors = require(Runtime.getFunctions()['utilities/cors-response'].path);
  // Note: .private.js files are keyed without the `.private` segment
  const { fetchSubaccountAuthToken } = require(
    Runtime.getFunctions()['fetchSubaccountAuthToken'].path
  );

  const result = await fetchSubaccountAuthToken(context, event.subaccountSid);

  if (!result.ok) {
    return callback(null, cors.response({ ok: false, error: result.error }));
  }

  return callback(null, cors.response({
    ok: true,
    sid: result.data.sid,
    friendlyName: result.data.friendlyName,
    status: result.data.status,
    hasAuthToken: typeof result.data.authToken === 'string' && result.data.authToken.length > 0
  }));
};
