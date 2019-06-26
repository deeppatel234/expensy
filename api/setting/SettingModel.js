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

  async getSettingV2(value, context) {
    const { setting, ...rest } = await this.readone({ userId: context.user.id }, context);
    const parsedSetting = setting ? (JSON.parse(setting) || {}) : {};
    return { ...rest, ...parsedSetting };
  }

  async saveSetting(value, context) {
    const { setting, ...rest } = await this.updateone({
      query: { userId: context.user.id },
      record: { setting: JSON.stringify(value.setting) }
    }, context);

    const parsedSetting = JSON.parse(setting) || {};
    return { ...rest, ...parsedSetting };
  }
}

module.exports = new Setting({ document: 'setting' });
