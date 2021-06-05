module.exports.ResponseFactory = class ResponseFactory {
  static ok(body) {
    return {
      statusCode: 200,
      body: JSON.stringify(body),
    };
  }

  static badRequest(body) {
    return {
      statusCode: 400,
      body: JSON.stringify(body),
    };
  }

  static internalServerError(body) {
    return {
      statusCode: 500,
      body: JSON.stringify(body),
    };
  }
};
