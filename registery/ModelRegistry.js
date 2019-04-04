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
    return new Promise((res, rej) => {
      try {
        const modules = fs.readdirSync(apiDirectory);
        modules.forEach((module) => {
          const modulePath = `${apiDirectory}/${module}`;
          const state = fs.lstatSync(modulePath);
          if (state.isDirectory()) {
            let files = fs.readdirSync(modulePath);
            files = files.filter(file => file.endsWith('Model.js'));
            files.forEach((file) => {
              const modelImport = require(`${modulePath}/${file}`);
              modelImport.env = this.data;
              this.set(modelImport.documentName, modelImport);
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
