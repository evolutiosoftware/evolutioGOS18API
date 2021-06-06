"use strict";
const { AuthParser } = require("/opt/node-js/auth/scope-parser");
const { ReferralRepository } = require("/opt/node-js/db/referral-repository");
const {
  ResponseFactory,
} = require("/opt/node-js/response-factory/response-factory");

async function functionHandler(event, context) {
  const referralRepository = new ReferralRepository();
  const scopeParser = new AuthParser();
  const scopeAndClient = scopeParser.getClientAndScopes(
    event.headers["Authorization"]
  );
  const referralStatus = 100;
  let referral = {};

  if (clientDoesNotHaveWritePermissions(scopeAndClient)) {
    return ResponseFactory.badRequest({
      message: `Cannot perform save as client: '${
        scopeAndClient.client || ""
      }' does not have write permissions.`,
    });
  }

  try {
    referral = JSON.parse(event.body);
  } catch (e) {
    return ResponseFactory.badRequest({
      message:
        "Body could not be parsed. Recheck the body of the request and try again.",
    });
  }

  if (!validate(referral)) {
    return ResponseFactory.badRequest({
      message: "Referral failed validation. Fix mistakes and try again!",
    });
  }

  referral.referralId = generateGUID(context);

  let item = {
    referralId: referral.referralId, //dynamodb PK
    referral: referral, //gos 18
    referralStatus: referralStatus, // always initially 100
    siteCode: referral["referral"]["siteCode"], // used for
  };

  try {
    await referralRepository.saveReferral(item);

    return ResponseFactory.ok({
      message: "Referral saved successfully",
      referralId: referral.referralId,
    });
  } catch (e) {
    console.error(e.message);
    return ResponseFactory.internalServerError({
      message: "There was an issue with the saving of the referral",
      error: e,
    });
  }
}

exports.handler = async (event, context) => {
  try {
    return await functionHandler(event, context);
  } catch (error) {
    console.error(error.message);
    return ResponseFactory.internalServerError({
      message: "There was an internal server error.",
    });
  }
};

/**
 * this is a simple example of validating a referral. in this example we return true if the referral has a siteCode and false otherwise.
 * @param {*} item
 * @returns isValid
 */
function validate(item) {
  const siteCode = item["referral"]["siteCode"];
  if (siteCode) return true;
  else return false;
}

/**
 * example of how to create a GUID for the referral
 * @returns referralId
 */
function generateGUID(context) {
  let awsRequestId = context.awsRequestId;
  let guid = "{" + awsRequestId + "}";
  return guid;
}

function clientDoesNotHaveWritePermissions(scopeAndClient) {
  if (
    (scopeAndClient.scopes || []).map((x) => x.toLowerCase()).includes("write")
  ) {
    return false;
  }

  return true;
}
