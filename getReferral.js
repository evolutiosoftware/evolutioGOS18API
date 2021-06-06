"use strict";
const { AuthParser } = require("/opt/node-js/auth/scope-parser");
const { ReferralRepository } = require("/opt/node-js/db/referral-repository");
const {
  ResponseFactory,
} = require("/opt/node-js/response-factory/response-factory");

async function functionHandler(event) {
  console.log(event);
  const parser = new AuthParser();
  const referralRepository = new ReferralRepository();
  let clientAndScopes = { client: "", scopes: [] };
  let referrals = [];

  try {
    clientAndScopes = parser.getClientAndScopes(event.headers["Authorization"]);
  } catch (e) {
    return ResponseFactory.badRequest({
      message: "There was an issue with the request.",
      error: e.message,
    });
  }

  let siteCodes = getSiteCodes(clientAndScopes.client);
  try {
    referrals = await referralRepository.getReferral(siteCodes);
  } catch (error) {
    console.error(error);
    return ResponseFactory.internalServerError({
      message: "There was an issue with the request.",
      error: error.message,
    });
  }

  try {
    await referralRepository.updateReferrals(referrals);
  } catch (e) {
    console.error(e);
    return ResponseFactory.internalServerError({
      message: "Failed to update referrals.",
      error: e.message,
    });
  }

  return ResponseFactory.ok({
    referrals,
  });
}

module.exports.handler = async (event) => {
  try {
    return await functionHandler(event);
  } catch (error) {
    console.error(error.message);
    return ResponseFactory.internalServerError({
      message: "There was an internal server error.",
    });
  }
};

function getSiteCodes(client) {
  console.log(client);
  if (client == "EVO") {
    return [500, 501];
  } else if (client == "VAN") {
    return [600, 601];
  } else {
    return [];
  }
}
