const { Fields, getObjectID } = require('mongoorm');
const _pick = require('lodash/pick');
const _keyBy = require('lodash/keyBy');
const _intersection = require('lodash/intersection');


/*
  any ( access any record ),
  own ( access own record only ),
  share ( own + other sharable, :public - publicaly sharable only ),
  denide (not perform operation)
  attributes: * or list of fields
*/

const ACCESS = {
  ANY: 'ANY',
  OWN: 'OWN',
  DENIED: 'DENIED',
  SHARE: 'SHARE',
  PUBLIC: 'PUBLIC',
};

const OPERATIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
};

const ROLE = {
  ADMIN: 'admin',
  USER: 'user',
  PUBLIC: 'public',
};

const ALL_ATTRIBUTE = '*';

/**
 * Use this Rules if not defined
 */
const DEFAULT_ACCESS = {
  [ROLE.ADMIN]: {
    [OPERATIONS.CREATE]: { rule: ACCESS.ANY, attributes: ALL_ATTRIBUTE },
    [OPERATIONS.READ]: { rule: ACCESS.ANY, attributes: ALL_ATTRIBUTE },
    [OPERATIONS.UPDATE]: { rule: ACCESS.ANY, attributes: ALL_ATTRIBUTE },
    [OPERATIONS.DELETE]: { rule: ACCESS.ANY, attributes: ALL_ATTRIBUTE },
  },
  [ROLE.USER]: {
    [OPERATIONS.CREATE]: { rule: ACCESS.OWN, attributes: ALL_ATTRIBUTE },
    [OPERATIONS.READ]: { rule: ACCESS.OWN, attributes: ALL_ATTRIBUTE },
    [OPERATIONS.UPDATE]: { rule: ACCESS.OWN, attributes: ALL_ATTRIBUTE },
    [OPERATIONS.DELETE]: { rule: ACCESS.OWN, attributes: ALL_ATTRIBUTE },
  },
  [ROLE.PUBLIC]: {
    [OPERATIONS.CREATE]: { rule: ACCESS.DENIED, attributes: ALL_ATTRIBUTE },
    [OPERATIONS.READ]: { rule: ACCESS.DENIED, attributes: ALL_ATTRIBUTE },
    [OPERATIONS.UPDATE]: { rule: ACCESS.DENIED, attributes: ALL_ATTRIBUTE },
    [OPERATIONS.DELETE]: { rule: ACCESS.DENIED, attributes: ALL_ATTRIBUTE },
  },
};


const AccessControl = ClassName => class extends ClassName {
  /**
   * ===================================
   *        Override Methods
   * ===================================
   */

  initFields(fields) {
    return { ...super.initFields(fields), ...this.__AccessControl_scanFields(fields) };
  }

  controllers() {
    return [...super.controllers(), {
      route: '/create',
      method: this.create,
      params: ['record'],
      auth: !this.hasPublicAccess(OPERATIONS.CREATE),
    }, {
      route: '/createmany',
      method: this.createMany,
      params: ['records'],
      auth: !this.hasPublicAccess(OPERATIONS.CREATE),
    }, {
      route: '/read',
      method: this.read,
      params: [['query', 'ids', 'id', 'own']],
      auth: !this.hasPublicAccess(OPERATIONS.READ),
    }, {
      route: '/readone',
      method: this.readone,
      params: [['query', 'id', 'own']],
      auth: !this.hasPublicAccess(OPERATIONS.READ),
    }, {
      route: '/updateone',
      method: this.updateone,
      params: ['query', 'data'],
      auth: !this.hasPublicAccess(OPERATIONS.UPDATE),
    }, {
      route: '/updatemany',
      method: this.updatemany,
      params: ['query', 'data'],
      auth: !this.hasPublicAccess(OPERATIONS.UPDATE),
    }, {
      route: '/deleteone',
      method: this.deleteone,
      params: ['query'],
      auth: !this.hasPublicAccess(OPERATIONS.DELETE),
    }];
  }

  /**
   * ===================================
   *        Private Methods
   * ===================================
   */

  /**
   * compute access rules and return query
   *
   * @param {obect} query
   * @param {string} rule
   * @param {ObectId} context
   */
  __AccessControl_getAccessRuleQuery(query, rule, context) {
    let { id: userId } = context.user;

    if (context.sudo || rule === ACCESS.ANY) {
      return query;
    }

    if (!userId || rule === ACCESS.PUBLIC) {
      return Object.assign(query, { isPublic: true });
    }

    userId = getObjectID(userId);

    if (rule === ACCESS.OWN) {
      return Object.assign(query, { userId });
    }

    if (rule === ACCESS.SHARE) {
      return Object.assign(query, {
        $or: [{ userId }, { sharedUserIds: { $in: [userId] } }],
      });
    }
  }

  /**
   * check model has create access
   *
   * @param {object} accessRule
   * @param {object} context
   * @param {object} data
   * data = {
   *  record, // data to create
   * }
   *
   * @returns {object} data to create with access rules
   *
   * TODO: check for multiple record
   */
  __AccessControl_hasCreateAccess(accessRule, data, context) {
    const createAccessData = {};
    if (context.user.id) {
      createAccessData.userId = getObjectID(context.user.id);
    } else {
      createAccessData.isPublic = true;
    }

    const filteredData = this.__AccessControl_filterAttribute(data.record, accessRule.attributes, context);
    return Promise.resolve(Object.assign(filteredData, createAccessData));
  }

  /**
   * check model has delete access
   *
   * @param {object} accessRule
   * @param {object} context
   * @param {object} data
   * data = {
   *  query, // delete query
   * }
   *
   * @returns {object} delete query with access rules
   */
  __AccessControl_hasDeleteAccess(accessRule, data, context) {
    const query = this.__AccessControl_getAccessRuleQuery(data.query, accessRule.rule, context);
    return Promise.resolve(query);
  }

  /**
   * check model has read access
   *
   * @param {object} accessRule
   * @param {object} context
   * @param {object} data
   * data = {
   *  query, // read query
   *  id,
   *  ids,
   *  fields,
   * }
   *
   * @returns {object} { query, options } read query and options with access rules
   */
  __AccessControl_hasReadAccess(accessRule, data, context) {
    const query = data.query || {};
    const options = {};

    if (data.id) {
      query._id = getObjectID(data.id);
    }

    if (data.ids) {
      query._id = { $in: data.ids.map(id => getObjectID(id)) };
    }

    if (data.own) {
      query.userId = getObjectID(context.user.id);
    }

    // filter document fields
    if (data.fields) {
      options.projection = this.__AccessControl_filterAttribute(data.fields, accessRule.attributes, context);
    } else if (accessRule.attributes !== ALL_ATTRIBUTE) {
      options.projection = accessRule.attributes;
    }

    return Promise.resolve({
      query: this.__AccessControl_getAccessRuleQuery(query, accessRule.rule, context),
      options,
    });
  }

  /**
   * check model has update access
   *
   * @param {object} accessRule
   * @param {object} user
   * @param {object} data
   * data = {
   *  query, // update query
   *  record, // data to update
   * }
   *
   * @returns {object} { searchQuery, data } update query and data with access rules
   */
  __AccessControl_hasUpdateAccess(accessRule, data, context) {
    return Promise.resolve({
      searchQuery: this.__AccessControl_getAccessRuleQuery(data.query, accessRule.rule, context),
      data: this.__AccessControl_filterAttribute(data.record, accessRule.attributes, context),
    });
  }

  /**
   * prepare query before perform opration
   *
   * -> convert string object id to mongodb supported mongo id object
   *
   * @param {object} query
   */
  __AccessControl_prepareQueryData(query) {
    const elements = _pick(this.schema.fields.props.ele, Object.keys(query));
    const keys = [];
    Object.keys(elements).forEach((ele) => {
      if (Fields.ObjectIdField === elements[ele].fieldClass) {
        keys.push(ele);
      }
    });
    keys.forEach((key) => {
      if (key in query) {
        query[key] = getObjectID(query[key]);
      }
    });
    return query;
  }

  /**
   * remove unauthorized attributes from values
   *
   * @param {object} values
   * @param {list} attributes
   */
  __AccessControl_filterAttribute(values, attributes, context) {
    if (!context.sudo && attributes !== '*') {
      return Array.isArray(values) ?  _intersection(values, attributes) : _pick(values, attributes);
    }
    return values;
  }

  /**
   * Compute and scan access controll fields
   */
  __AccessControl_scanFields(fields) {
    this.accessRules = Object.assign({}, DEFAULT_ACCESS, this.accessControls({
      ACCESS,
      OPERATIONS,
      ROLE,
      ALL_ATTRIBUTE,
    }));

    const accessFields = {
      userId: fields.ObjectId(),
    };

    Object.keys(this.accessRules)
      .forEach(role => Object.keys(this.accessRules[role]).forEach((operation) => {
        const { rule } = this.accessRules[role][operation];
        if (!accessFields.sharedUserIds && rule === ACCESS.SHARE) {
          accessFields.sharedUserIds = fields.Array({ ele: fields.ObjectId() });
        }
        if (!accessFields.isPublic && rule === ACCESS.PUBLIC) {
          accessFields.isPublic = fields.Boolean();
        }
      }));
    return accessFields;
  }

  /**
   * ===================================
   *        Public Methods
   * ===================================
   */

  /**
   * assign access controles to document
   */
  accessControls() {
    return {};
  }

  /**
   * check operation have public access
   *
   * @param {string} operation
   */
  hasPublicAccess(operation) {
    return this.accessRules.public[operation] !== ACCESS.DENIED;
  }

  /**
   * check model have access of passed opration
   *
   * @param {string} opration
   * @param {string} role
   * @param {object} user
   * @param {object} data
   */
  hasAccess(opration, data = {}, context = {}) {
    const userRole = context.sudo ? ROLE.ADMIN : context.user.role;
    const accessRule = this.accessRules[userRole][opration];

    if (!context.sudo && accessRule.rule === ACCESS.DENIED) {
      return Promise.reject(new Error('Access Denied'));
    }

    if (opration === OPERATIONS.CREATE) {
      return this.__AccessControl_hasCreateAccess(accessRule, data, context);
    } else if (opration === OPERATIONS.DELETE) {
      return this.__AccessControl_hasDeleteAccess(accessRule, data, context);
    } else if (opration === OPERATIONS.READ) {
      return this.__AccessControl_hasReadAccess(accessRule, data, context);
    } else if (opration === OPERATIONS.UPDATE) {
      return this.__AccessControl_hasUpdateAccess(accessRule, data, context);
    } else {
      return Promise.reject(new Error('Access Denied'));
    }
  }

  /**
   * ===================================
   *        CRUD Methods
   * ===================================
   */

  /**
   * Create record
   *
   * @param {object} value
   * @param {object} user
   */
  async create({ record }, context) {
    const dataToCreate = await this.hasAccess(OPERATIONS.CREATE, { record }, context);

    const newRecord = this.createRecord(dataToCreate);
    await newRecord.save();
    return newRecord.get();
  }

  /**
   * Create multiple record
   *
   * @param {object} value
   * @param {object} user
   */
  async createMany({ records }, context) {
    let datasToCreate = await Promise.all(records.map(record => this.hasAccess(OPERATIONS.CREATE, { record }, context)));

    datasToCreate.forEach((dc) => {
      if (dc._id) {
        dc.mid = dc._id;
        delete dc._id;
      }
    });

    datasToCreate = _keyBy(datasToCreate, 'mid');

    const response = [];

    const mids = Object.keys(datasToCreate);

    for (let i = 0; i < mids.length; i++) {
      const mid = mids[i];
      const newRecord = this.createRecord(datasToCreate[mid]);
      await newRecord.save();
      response.push({ ...newRecord.get(), mid });
    }

    return response;
  }

  /**
   * Delete Single record
   *
   * @param {object} value
   * @param {object} user
   */
  async deleteone({ query }, context) {
    const deleteQuery = await this.hasAccess(OPERATIONS.DELETE, { query }, context);

    const deleteRes = await this.deleteOne(this.__AccessControl_prepareQueryData(deleteQuery));
    return { deleted: deleteRes };
  }

  /**
   * Read record(s)
   *
   * @param {object} value
   * @param {object} user
   */
  async read(value, context) {
    const readQuery = await this.hasAccess(OPERATIONS.READ, value, context);
    return new Promise((res, rej) => {
      this.find(this.__AccessControl_prepareQueryData(readQuery.query), readQuery.options).toArray(function (err, data) {
        if (err) {
          rej(err);
        } else {
          res(data);
        }
      });
    });
  }

  /**
   * Read record(s)
   *
   * @param {object} value
   * @param {object} user
   */
  async readone(value, context) {
    const readQuery = await this.hasAccess(OPERATIONS.READ, value, context);
    return await this.findOne(this.__AccessControl_prepareQueryData(readQuery.query), readQuery.options);
  }

  /**
   * Update Single Record
   *
   * @param {object} value
   * @param {object} user
   */
  async updateone(value, context) {
    const updateQuery = await this.hasAccess(OPERATIONS.UPDATE, value, context);

    const dbrecord = await this.findOne(this.__AccessControl_prepareQueryData(updateQuery.searchQuery));
    if (!dbrecord || dbrecord === null) {
      throw new Error('Data not found');
    }

    const updateRecord = this.createRecord(dbrecord);
    updateRecord.set(updateQuery.data);
    await updateRecord.save();
    return updateRecord.get();
  }

  /**
   * Update Multiple Record
   *
   * @param {object} value
   * @param {object} user
   */
  async updatemany(value, context) {
    const updateQuery = await this.hasAccess(OPERATIONS.UPDATE, value, context);
    const updateManuRes = await this.updateMany(this.__AccessControl_prepareQueryData(updateQuery.searchQuery), updateQuery.data);
    return { updated: updateManuRes };
  }
};

module.exports = AccessControl;
