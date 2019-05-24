// Internal Module
const { Document } = require('mongoorm');

const Mixins = require('../../mixins');

const DEFAULT_CATEGORIES = [{
  name: 'Shopping',
  icon: 'SHOPPING_CART',
}, {
  name: 'Phone',
  icon: 'PHONE',
}, {
  name: 'Movies',
  icon: 'MOVIE_OUTLINE',
}, {
  name: 'Bills',
  icon: 'RECEIPT',
}, {
  name: 'Games',
  icon: 'GAME_CONTROLLER',
}, {
  name: 'Home',
  icon: 'HOME',
}, {
  name: 'Food and Drinks',
  icon: 'WINE',
}, {
  name: 'Medical',
  icon: 'MEDICINE_BOX',
}, {
  name: 'Gifts',
  icon: 'GIFT',
}, {
  name: 'Vehicle',
  icon: 'CAR',
}, {
  name: 'Transportation',
  icon: 'BUS',
}];

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

  createDefaultCategory(context) {
    return this.createMulti(DEFAULT_CATEGORIES, context);
  }
}

module.exports = new Category({ document: 'category' });
