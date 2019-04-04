// Library Imports
const crypto = require('crypto');

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
      role: fields.String({ required: true, defaultValue: 'user' }),
      email: fields.String({ required: true, email: true, unique: true }),
      password: fields.String({ required: true }),
      isConfirmEmail: fields.Boolean(),
      confirmMailId: fields.String(),
      forgotPasswordId: fields.String(),
    });
  }

  /**
   * @override AccessControl Mixin
   */
  accessControls({ ACCESS, OPERATIONS, ROLE, ALL_ATTRIBUTE }) {
    return {
      [ROLE.ADMIN]: {
        [OPERATIONS.READ]: { rule: ACCESS.ANY, attributes: ALL_ATTRIBUTE },
        [OPERATIONS.UPDATE]: { rule: ACCESS.OWN, attributes: ALL_ATTRIBUTE },
        [OPERATIONS.CREATE]: { rule: ACCESS.ANY, attributes: ALL_ATTRIBUTE },
        [OPERATIONS.DELETE]: { rule: ACCESS.DENIED, attributes: ALL_ATTRIBUTE },
      },
      [ROLE.USER]: {
        [OPERATIONS.READ]: { rule: ACCESS.OWN, attributes: ['firstname', 'lastname', 'username', 'email', 'profileImage', 'isConfirmEmail'] },
        [OPERATIONS.UPDATE]: { rule: ACCESS.OWN, attributes: ['firstname', 'lastname', 'username', 'email', 'password', 'profileImage'] },
        [OPERATIONS.CREATE]: { rule: ACCESS.DENIED, attributes: ALL_ATTRIBUTE },
        [OPERATIONS.DELETE]: { rule: ACCESS.OWN, attributes: ALL_ATTRIBUTE },
      }
    };
  }

  /**
   * @override AccessControl Mixin
   */
  __AccessControl_getAccessRuleQuery(query, rule, context) {
    if (rule === 'OWN' || query.userId) {
      Object.assign(query, {
        _id: getObjectID(context.user.id),
      });
    }
    return query;
  }

  /**
   * @override AccessControl Mixin
   */
  __AccessControl_scanFields(fields) {
    super.__AccessControl_scanFields(fields);
    return {};
  }

  getHashPassword(password) {
    return crypto.createHash('sha512').update(password).digest('hex');
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
      type: 'post',
      route: '/login',
      method: this.loginController,
      params: ['username', 'password'],
      auth: false,
    }, {
      route: '/signup',
      method: this.signUpController,
      params: ['record'],
      auth: false,
    }, {
      route: '/varify',
      method: this.varifyController,
      params: ['token'],
      auth: false,
    }, {
      route: '/myinfo',
      method: this.myInfoController,
    }]);
  }

  async loginController(value, context, req) {
    const user = await this.findOne({
      username: value.username,
      password: this.getHashPassword(value.password),
    });

    if (!user) {
      throw new Error('username or password not match');;
    }

    const accessToken = await ModelRegistry.get('token').createAccessToken(user, req.headers['user-agent'], context);

    return { token: accessToken };
  }

  async signUpController(value, context, req) {
    let { record } = value;
    record = { ...record, password: record.password && this.getHashPassword(record.password) };
    const user = await this.create({ record }, this.sudoContext(context));

    const accessToken = await ModelRegistry.get('token').createAccessToken(user, req.headers['user-agent'], context);

    return { token: accessToken };
  }


  async varifyController(value) {
    const { isValid } = await ModelRegistry.get(value.token);
    return { isValid };
  }

  async myInfoController(value, context) {
    return this.readone({ id: context.user.id }, context);
  }
}

module.exports = new User({ document: 'user' });
