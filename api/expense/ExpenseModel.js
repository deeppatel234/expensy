// Internal Module
const { Document } = require('mongoorm');

const Mixins = require('../../mixins');

class Expense extends Mixins(Document).with('Controllers', 'AccessControl') {
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
      type: fields.String({ required: true, enum: ['income', 'expense', 'transfer'] }),
      description: fields.String(),
      amount: fields.Number({ required: true }),
      wallet: fields.ObjectId({ required: true }),
      toWallet: fields.ObjectId(),
      category: fields.ObjectId({ required: true }),
      dateTime: fields.DateTime({ required: true, defaultValue: 'now' }),
    });
  }
}

module.exports = new Expense({ document: 'expense' });
