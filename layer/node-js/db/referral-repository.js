const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient({ region: "eu-west-2" });

module.exports.ReferralRepository = class ReferralRepository {
  async getReferral(siteCodes) {
    if (!Array.isArray(siteCodes) || siteCodes.length == 0) {
      throw new Error("Site codes were not passed into the database request.");
    }

    let params = {
      TableName: "referrals",
      FilterExpression: `(#referralStatus = :status) AND `,
      ExpressionAttributeNames: {
        "#referralStatus": "referralStatus",
        "#siteCode": "siteCode",
      },
      ExpressionAttributeValues: {
        ":status": 100,
      },
    };

    let filterExpression = params.FilterExpression + "(";
    siteCodes.forEach((code) => {
      params.ExpressionAttributeValues[`:code${code}`] = `${code}`;
      filterExpression += `(#siteCode = :code${code}) OR `;
    });
    filterExpression = filterExpression.slice(0, -4);
    filterExpression += ")";

    params.FilterExpression = filterExpression;

    console.log(params);

    try {
      let dbResponse = await dynamo.scan(params).promise();
      return dbResponse.Items;
    } catch (e) {
      throw new Error(
        `There was an issue with getting the referrals. Error: '${e}'.`
      );
    }
  }

  async updateReferrals(referrals) {
    for await (let referral of referrals) {
      await dynamo
        .update({
          TableName: "referrals",
          Key: {
            referralId: referral.referralId,
          },
          UpdateExpression: "set referralStatus = :newStatus",
          ExpressionAttributeValues: {
            ":newStatus": 200,
          },
        })
        .promise();
    }
  }

  async saveReferral(referralToBeSaved) {
    const params = {
      TableName: "referrals",
      Item: referralToBeSaved,
    };

    await dynamo.put(params).promise();
  }
};
