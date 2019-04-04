// Internal Module
const { Document, getObjectID } = require('mongoorm');

const Mixins = require('../../mixins');

class PaymentMethod extends Mixins(Document).with('Controllers', 'AccessControl') {
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
      balance: fields.Number({ required: true }),
    });
  }
}

module.exports = new PaymentMethod({ document: 'paymentmethod' });
