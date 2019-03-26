const fs = require('fs');
const path = require('path');
const Registery = require('./Registery');

const apiDirectory = path.join(__dirname, '../api');

class ModelRegistery extends Registery {
  /*
    Scan Files from API Directory
    Create module directory in API.
    Model name must end with Model.js

    api/
      moduleName/
        MyModel.js
  */
  scanModules() {
    const self = this;
    return new Promise((res, rej) => {
      try {
        const modules = fs.readdirSync(apiDirectory);
        modules.forEach(function (module) {
          const modulePath = `${apiDirectory}/${module}`;
          const state = fs.lstatSync(modulePath);
          if (state.isDirectory()) {
            let files = fs.readdirSync(modulePath);
            files = files.filter(file => file.endsWith('Model.js'));
            files.forEach(function (file) {
              const modelImport = require(`${modulePath}/${file}`);
              self.set(modelImport.documentName, modelImport);
            });
          }
        });
        res();
      } catch (err) {
        rej(err);
      }
    });
  }
}

module.exports = new ModelRegistery();
