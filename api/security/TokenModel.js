const { Document, ObjectId, getObjectID } = require('mongoorm');
const crypto = require('crypto');
const config = require('../../base/Config');

const Mixins = require('../../mixins');

class Token extends Mixins(Document).with('AccessControl', 'Controllers') {
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
      token: fields.String({ string: 'Token', required: true }),
      loginAt: fields.DateTime({ string: 'Login At', required: true }),
      logoutAt: fields.DateTime({ string: 'Logout At' }),
      isLoggedIn: fields.Boolean({ string: 'Logged In' }),
      userAgent: fields.String({ string: 'User Agent' }),
      userId: fields.ObjectId({ required: true }),
      userRole: fields.String({ required: true }),
    });
  }

  /**
   * generate access token of user
   *
   */
  async createAccessToken(user, userAgent, context) {
    const payload = {
      unique_id: new ObjectId().toString(),
      userid: user._id,
      role: user.role,
    };

    const record = await this.create({
      record: {
        token: crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
        loginAt: new Date().toUTCString(),
        isLoggedIn: true,
        userAgent,
        userId: user._id,
        userRole: user.role,
      },
    }, this.sudoContext(context));

    return record.token;
  }

  /**
   * varify token
   *
   * @param {string} token
   */
  async varifyAccessToken(token) {
    const tokenRecord = await this.findOne({ token , isLoggedIn: true });
    if (tokenRecord) {
      return { isValid: true, user: { id: tokenRecord.userId.toString(), role: tokenRecord.userRole } };
    }
    return { isValid: false, user: false };
  }

  /**
   * delete user token and signout fron session
   */
  async singout(token) {
    const res = await this.updateOne({
      token,
      isLoggedIn: true,
    }, {
      $set: {
        isLoggedIn: false,
        logoutAt: new Date().toUTCString(),
        token: '',
      },
    });
    if (res && res.result.nModified === 1) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('something went wrong'));
  }
}

module.exports = new Token({ document: 'token' });
