const MixinRegistery = require('../registery/MixinRegistery');

class MixinBuilder {
  constructor(superclass) {
    this.superclass = superclass;
  }

  computeMixins(mixins) {
    return mixins.map(m => (typeof m === 'string' ? MixinRegistery.get(m) : m));
  }

  with(...mixins) {
    return this.computeMixins(mixins).reduce((c, mixin) => mixin(c), this.superclass);
  }
}

module.exports = superclass => new MixinBuilder(superclass);
