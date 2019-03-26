/**
 * The registry is really pretty much only a mapping from some keys to some
 * values. The Registry class only add a few simple methods around that to make
 * it nicer.
 *
 * Sometimes you cannot just simply import something. In that case, registries might
 * help.
 */
class Registery {
  constructor() {
    this.data = {};
  }

  /**
   * Add a key and a value to the registry.
   *
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    this.data[key] = value;
  }

  /**
   * Returns the value associated to the given key.
   *
   * @param {string} key
   * @returns {any}
   */
  get(key) {
    return this.data[key];
  }

  /**
   * forEach iterator for all values.
   *
   * @param {function} cb
   */
  forEach(cb) {
    const self = this;
    Object.keys(this.data).forEach(function (key) {
      cb(self.data[key]);
    });
  }
}

module.exports = Registery;
