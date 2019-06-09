// Library Imports
const crypto = require('crypto');

// Internal Module
const { Document, getObjectID } = require('mongoorm');

const Mixins = require('../../mixins');

class User extends Mixins(Document).with('Controllers', 'AccessControl') {
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
      email: fields.String({ required: true, email: true, unique: true }),
      password: fields.String({ required: true }),
      role: fields.String({ required: true, defaultValue: 'user' }),
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
        [OPERATIONS.READ]: { rule: ACCESS.OWN, attributes: ['name', 'email', 'isConfirmEmail'] },
        [OPERATIONS.UPDATE]: { rule: ACCESS.OWN, attributes: ['name', 'email', 'password'] },
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
   * Create record
   *
   * @param {object} value
   * @param {object} user
   */
  async create(record, context) {
    const user = await super.create(record, context);
    const userContext = { ...context, user: { id: user._id } };
    await this.env.setting.create({ record: {} }, userContext);
    await this.env.category.createDefaultCategory(userContext);
    await this.env.wallet.createDefaultWallet(userContext);
    return user;
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
      params: ['email', 'password'],
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
      email: value.email,
      password: this.getHashPassword(value.password),
    });

    if (!user) {
      throw new Error('email or password not match');;
    }

    const accessToken = await this.env.token.createAccessToken(user, req.headers['user-agent'], context);

    return { token: accessToken };
  }

  async signUpController(value, context, req) {
    let { record } = value;
    record = { ...record, password: record.password && this.getHashPassword(record.password) };
    const user = await this.create({ record }, this.sudoContext(context));

    const accessToken = await this.env.token.createAccessToken(user, req.headers['user-agent'], context);

    return { token: accessToken };
  }


  async varifyController(value) {
    const { isValid } = await this.env.token.varifyAccessToken(value.token);
    return { isValid };
  }

  async myInfoController(value, context) {
    return this.readone({ id: context.user.id }, context);
  }
}

module.exports = new User({ document: 'user' });
