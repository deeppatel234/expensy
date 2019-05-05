// Internal Module
const { Document } = require('mongoorm');

const Mixins = require('../../mixins');

class Wallet extends Mixins(Document).with('Controllers', 'AccessControl', 'Sync') {
  /**
   * ===================================
   *        Override Methods
   * ===================================
   */

  /**
   * initialize field
   *
   * @param {object} fields
   * @override
   */
  initFields(fields) {
    return Object.assign(super.initFields(fields), {
      name: fields.String({ required: true }),
      type: fields.String({ required: true, enum: ['bank', 'cash'] }),
      icon: fields.String({ required: true }),
      currency: fields.String({ required: true }),
      balance: fields.Number({ required: true }),
    });
  }
}

module.exports = new Wallet({ document: 'wallet' });
