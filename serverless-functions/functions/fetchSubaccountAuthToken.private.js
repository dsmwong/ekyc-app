/**
 * Private helper: fetchSubaccountAuthToken
 *
 * This file uses the `.private.js` suffix so Twilio Serverless does NOT
 * expose it as an HTTP endpoint. It can only be invoked from another
 * Function via `Runtime.getFunctions()['fetchSubaccountAuthToken.private'].path`.
 */

exports.fetchSubaccountAuthToken = async function (context, subaccountSid) {
  if (!subaccountSid) {
    return { ok: false, error: 'subaccountSid is required' };
  }

  if (!/^AC[0-9a-f]{32}$/i.test(subaccountSid)) {
    return {
      ok: false,
      error: 'subaccountSid does not look like a valid Account SID (expected AC...)'
    };
  }

  const client = context.getTwilioClient();

  try {
    const account = await client.api.v2010.accounts(subaccountSid).fetch();

    if (account.ownerAccountSid === account.sid) {
      return { ok: false, error: 'Provided SID is the main account, not a subaccount' };
    }

    if (account.ownerAccountSid !== context.ACCOUNT_SID) {
      return {
        ok: false,
        error: 'Account is not a subaccount of the configured parent account'
      };
    }

    return {
      ok: true,
      data: {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        authToken: account.authToken,
        ownerAccountSid: account.ownerAccountSid,
        dateCreated: account.dateCreated,
        dateUpdated: account.dateUpdated
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: 'Failed to fetch subaccount',
      details: error.message
    };
  }
};
