module.exports = {
  /**
   * Called Before Server Start
   */
  pre() {
    return new Promise(async function (res, rej) {
      try {
        // Scan mixin from Mixins Directory
        const MixinRegistery = require('./registery/MixinRegistery');
        await MixinRegistery.scanMixins();

        // Scan Models from API Directory
        const ModelRegistry = require('./registery/ModelRegistry');
        await ModelRegistry.scanModules();

        res();
      } catch (err) {
        rej(err);
      }
    });
  },
  /**
   * Called After Server Start
   */
  post() {

  },
};
