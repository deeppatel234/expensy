// Internal Module
const { Document } = require('mongoorm');
const _keyBy = require('lodash/keyBy');
const _isEmpty = require('lodash/isEmpty');

const Mixins = require('../../mixins');

class Expense extends Mixins(Document).with('Controllers', 'AccessControl', 'Sync') {
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

  async syncController({ records, syncTime }, context) {
    if (!_isEmpty(records)) {
      const foreignKeys = ['category', 'wallet', 'toWallet'];

      for (let i = 0; i < foreignKeys.length; i++) {
        const key = foreignKeys[i];
        const keyRecords = records.filter(r => r[key] && r[key].length < 20);

        if(_isEmpty(keyRecords)) {
          continue;
        }

        const mids = keyRecords.map(kr => kr[key]);

        const model = key === 'category' ? 'category' : 'wallet';
        const relationRecords = await this.env[model].read({ query: { mid: { $in: mids } } }, context);

        const midMap = _keyBy(relationRecords, 'mid');

        keyRecords.forEach((kr) => {
          kr[key] = midMap[kr[key]]._id;
        });
      }
    }

    return super.syncController({ records, syncTime }, context);
  }
}

module.exports = new Expense({ document: 'expense' });
