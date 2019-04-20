const _groupBy = require('lodash/groupBy');
const _isEmpty = require('lodash/isEmpty');

const Sync = ClassName => class extends ClassName {
  controllers() {
    return [...super.controllers(), {
      route: '/sync',
      method: this.syncController,
    }];
  }

  initFields(fields) {
    return {
      ...super.initFields(fields),
      archive: fields.Boolean(),
      mid: fields.String(),
    };
  }

  /**
   * Create multiple record
   *
   * @param {object} value
   * @param {object} user
   */
  async SYNC_createMany(records, context) {
    return Promise.all(records.map(record => {
      delete record._id;
      return this.create({ record }, context)
    }));
  }

  async SYNC_updateMany(records, context) {
    return Promise.all(records.map(record => (
      this.updateone({
        query: { _id: record._id },
        data: record
      }, context)
    )));
  }

  async SYNC_deleteMany(records, context) {
    return Promise.all(records.map(record => (
      this.updateone({
        query: { _id: record._id },
        data: { archive: true }
      }, context)
    )));
  }

  async syncController({ records, syncTime }, context) {

    if (!_isEmpty(records)) {
      const groupRecords = _groupBy(records, 'sync');

      if (groupRecords.create) {
        try {
          await this.SYNC_createMany(groupRecords.create, context);
        } catch(err) {}
      }

      if (groupRecords.update) {
        try {
          await this.SYNC_updateMany(groupRecords.update, context);
        } catch(err) {}
      }

      if (groupRecords.delete) {
        try {
          await this.SYNC_deleteMany(groupRecords.delete, context);
        } catch(err) {}
      }
    }

    const readQuery = syncTime ? {
      query: {
        $or: [{ createAt: { $gte: syncTime } }, { writeAt: { $gte: syncTime } }]
      }
    } : { own: true };

    return {
      records: await this.read(readQuery, context),
      syncTime: new Date().toUTCString(),
    };
  }
};

module.exports = Sync;
