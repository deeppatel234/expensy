const _has = require('lodash/has');
const _difference = require('lodash/difference');

const ModelRegistry = require('../registery/ModelRegistry');
const logger = require('./Logger');
const response = require('./Response');
const Utils = require('./Utils');

const getTokenFromRequest = function (req) {
  // get token from cookie
  let { token } = req.cookies;
  // get token from authorization header
  if (!token) {
    const { authorization } = req.headers;
    if (authorization) {
      token = authorization.split(/\s+/).pop();
    }
  }
  return token;
};

const auth = async function (req, res, next) {
  next();
};

const reqtoken = function (req, res, next) {
  req.token = getTokenFromRequest(req);
  next();
};

const hasData = function (data) {
  return function (req, res, next) {
    const { body } = req;
    Utils.removeUndefinedNull(body);
    const hasKeys = data.every((key) => {
      return Array.isArray(key) ? key.some(k => _has(body, k)) : _has(body, key);
    });
    if (hasKeys) {
      next();
    } else {
      res.json(response.error(`missing params : ${_difference(data, Object.keys(body))}`, response.errorCode.NoDataPassed));
    }
  };
};

module.exports = {
  auth,
  hasData,
  reqtoken,
};
