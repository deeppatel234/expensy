// Library Imports
const express = require('express');
const ModelRegistry = require('../registery/ModelRegistry');

const router = express.Router();


ModelRegistry.forEach((model) => {
  if (model.getControllers) {
    router.use(`/${model.documentName}`, model.getControllers());
  }
});

module.exports = router;
