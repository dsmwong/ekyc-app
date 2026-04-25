/**
 * Private helper: getTwilioCredentials
 *
 * Resolves the Twilio credentials to use for a request.
 *  - If subaccountSid is empty/missing, returns the parent credentials.
 *  - If subaccountSid is provided, delegates to fetchSubaccountAuthToken
 *    to validate ownership and retrieve the subaccount's auth token.
 *
 * This file uses the `.private.js` suffix so Twilio Serverless does NOT
 * expose it as an HTTP endpoint. It is invoked from other Functions via
 * `Runtime.getFunctions()['getTwilioCredentials'].path`.
 */

exports.getTwilioCredentials = async function (context, subaccountSid) {
  // No subaccount requested — use parent credentials.
  if (!subaccountSid) {
    return {
      ok: true,
      data: {
        accountSid: context.ACCOUNT_SID,
        authToken: context.AUTH_TOKEN,
        usingParent: true
      }
    };
  }

  const { fetchSubaccountAuthToken } = require(
    Runtime.getFunctions()['fetchSubaccountAuthToken'].path
  );

  const result = await fetchSubaccountAuthToken(context, subaccountSid);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return {
    ok: true,
    data: {
      accountSid: result.data.sid,
      authToken: result.data.authToken,
      usingParent: false
    }
  };
};
