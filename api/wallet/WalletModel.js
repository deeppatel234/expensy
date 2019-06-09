// Internal Module
const { Document } = require('mongoorm');

const Mixins = require('../../mixins');

const DEFAULT_WALLETS = [{
  name: 'Cash',
  type: 'cash',
  icon: 'WALLET',
}];


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
      balance: fields.Number({ default: 0 }),
      initialBalance: fields.Number({ default: 0 }),
    });
  }

  createDefaultWallet(context) {
    return this.createMulti(DEFAULT_WALLETS, context);
  }
}

module.exports = new Wallet({ document: 'wallet' });
