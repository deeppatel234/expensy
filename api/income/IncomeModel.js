// Internal Module
const { Document, getObjectID } = require('mongoorm');

const Mixins = require('../../mixins');

class Income extends Mixins(Document).with('Controllers', 'AccessControl') {
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
      amount: fields.Number({ required: true }),
      payer: fields.String({ required: true }),
      paymentMethod: fields.ObjectId({ required: true }),
      category: fields.ObjectId({ required: true }),
      description: fields.String(),
      dateTime: fields.DateTime({ required: true, defaultValue: 'now' }),
    });
  }
}

module.exports = new Income({ document: 'income' });
