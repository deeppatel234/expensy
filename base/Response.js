
/**
 * Error Codes
 */
const errorCode = {
  Unauthorized: 401,
  NoDataPassed: 403,
  NotFound: 404,
  Unkonown: 333,
  CredentialError: 300,
  INTERNAL_SERVER_ERROR: 500,
};

module.exports = {
  errorCode,
  /**
   * Response Error
   *
   * @param {string} msg
   * @param {integer} code
   */
  error(error, code = errorCode.INTERNAL_SERVER_ERROR) {
    const err = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      code,
    };
    return { error: err };
  },
  /**
   * Response Data
   *
   * @param {object} data
   */
  data(data) {
    return data;
  },
};
