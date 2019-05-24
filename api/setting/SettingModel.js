// Internal Module
const { Document } = require('mongoorm');

const Mixins = require('../../mixins');

class Setting extends Mixins(Document).with('Controllers', 'AccessControl', 'Sync') {
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
      setting: fields.String(),
    });
  }

  controllers() {
    return [...super.controllers(), {
      route: '/save',
      method: this.saveSetting,
    }, {
      route: '/get',
      method: this.getSetting,
    }];
  }

  async getSetting(value, context) {
    const { setting } = await this.readone({ userId: context.user.id }, context);
    return JSON.parse(setting);
  }

  async saveSetting({ setting = {} }, context) {
    const record = await this.updateone({
      query: { userId: context.user.id },
      record: { setting: JSON.stringify(setting) }
    }, context);

    return JSON.parse(record.setting);
  }
}

module.exports = new Setting({ document: 'setting' });
