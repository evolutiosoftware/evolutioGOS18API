const jwtParser = require("jsonwebtoken");

module.exports.AuthParser = class AuthParser {
  getClientAndScopes(authHeaderValue) {
    if (authHeaderValue == undefined) {
      throw new Error("No authorization header present in request!");
    }

    const header = authHeaderValue.substring(7, authHeaderValue.length);
    const token = jwtParser.decode(header);
    let tokenScopes = token["scope"].split(" ");
    const filteredScopes = tokenScopes.filter((value, _, __) => {
      return value != "nhs/auth";
    });

    const clientEntries = filteredScopes
      .map((x) => x.split("/")[0])
      .filter((item, i, ar) => ar.indexOf(item) === i);
    if (clientEntries.entries.length > 1) {
      throw new Error("The scopes in the token contain more than one client.");
    }

    const client = clientEntries[0];

    let scopes = filteredScopes
      .map((x) => {
        const split = x.trim().split("/");

        if (split.length == 2 || split[0] == client) {
          return split[1];
        } else {
          return "";
        }
      })
      .filter((x) => x != "");

    return {
      client,
      scopes,
    };
  }
};
