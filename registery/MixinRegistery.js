const fs = require('fs');
const path = require('path');
const Registery = require('./Registery');

const mixinDirectory = path.join(__dirname, '../mixins');

class MinixRegistery extends Registery {
  /*
    Scan Files from Mixins Directory

    Mixins/
      MyMixin.js
  */
  scanMixins() {
    return new Promise((res, rej) => {
      try {
        const modules = fs.readdirSync(mixinDirectory);
        modules
          .filter(module => (module !== 'index.js'))
          .forEach((module) => {
            const mixinPath = `${mixinDirectory}/${module}`;
            const minixImport = require(mixinPath);
            this.set(module.replace('.js', ''), minixImport);
          });
        res();
      } catch (err) {
        rej(err);
      }
    });
  }
}

module.exports = new MinixRegistery();
