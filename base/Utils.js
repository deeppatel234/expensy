const _isPlainObject = require('lodash/isPlainObject');

module.exports = {
  removeUndefinedNull(obj) {
    Object.keys(obj).forEach((key) => {
      if (obj[key] === undefined || obj[key] === null) {
        delete obj[key];
        return;
      }
      if (_isPlainObject(obj[key])) {
        this.removeUndefinedNull(obj[key]);
      }
    });
  },
};
