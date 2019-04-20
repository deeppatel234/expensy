// Internal Module
const { Document } = require('mongoorm');

const Mixins = require('../../mixins');

class Category extends Mixins(Document).with('Controllers', 'AccessControl', 'Sync') {
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
      icon: fields.String({ required: true }),
    });
  }
}

module.exports = new Category({ document: 'category' });
