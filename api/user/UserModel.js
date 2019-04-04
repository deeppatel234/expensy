// Library Imports
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Internal Module
const { Document, getObjectID, ObjectId } = require('mongoorm');
const ModelRegistry = require('../../registery/ModelRegistry');

const Mixins = require('../../mixins');

class User extends Mixins(Document).with('AccessControl', 'Controllers') {
  /**
   * ===================================
   *        Override Methods
   * ===================================
   */

  constructor(props) {
    super(props);
  }

  /**
   * initialize field
   *
   * @param {object} fields
   * @override
   */
  initFields(fields) {
    return Object.assign(super.initFields(fields), {
      firstname: fields.String({ capitalize: true, required: true }),
      lastname: fields.String({ capitalize: true, required: true }),
      username: fields.String({ required: true, unique: true }),
      role: fields.String({ required: true, default: 'user' }),
      email: fields.String({ required: true, email: true, unique: true }),
      password: fields.String({ required: true }),
      passwordType: fields.String(),
      isConfirmEmail: fields.Boolean(),
      confirmMailId: fields.String(),
      forgotPasswordId: fields.String(),
    });
  }

  /**
   * @override AccessControl Mixin
   */
  accessControls() {
    return {
      admin: {
        read: { action: 'any', attributes: '*' },
        update: { action: 'own', attributes: '*' },
        create: { action: 'any', attributes: '*' },
        delete: { action: 'denide', attributes: '*' },
      },
      user: {
        read: { action: 'any', attributes: ['firstname', 'lastname', 'username', 'email', 'profileImage', 'passwordType', 'isConfirmEmail'] },
        update: { action: 'own', attributes: ['firstname', 'lastname', 'username', 'email', 'password', 'profileImage', 'passwordType'] },
        create: { action: 'own', attributes: ['firstname', 'lastname', 'username', 'email', 'password', 'profileImage', 'passwordType'] },
        delete: { action: 'own', attributes: '*' },
      },
      public: {
        read: { action: 'denide', attributes: '*' },
        update: { action: 'denide', attributes: '*' },
        create: { action: 'own', attributes: ['firstname', 'lastname', 'username', 'email', 'password', 'profileImage', 'passwordType'] },
        delete: { action: 'denide', attributes: '*' },
      },
    };
  }

  /**
   * ===================================
   *        Controllers
   * ===================================
   */

  /**
   * @override Controllers Mixin
   */
  controllers() {
    return this.overrideControllers(super.controllers(), [{
      type: 'get',
      route: '/search',
      method: this.searchUserController,
    }]);
  }

  searchUserController() {
    return { done: true };
  }
}

module.exports = new User({ document: 'user' });
