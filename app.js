// Library Imports
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');

const response = require('./base/Response');

// Init Express App
const app = express();

// Init Express Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Import Routes
const api = require('./api');

// Register Routes
app.use('/api', api);

// Catch 404 Not Found
app.use(function (req, res) {
  res.json(response.error('Not Found', response.errorCode.NotFound));
});

module.exports = app;
