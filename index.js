
// Library Imports
const mongoorm = require('mongoorm');
const http = require('http');

// set Environment variables
require('dotenv').config({ path: `${__dirname}/.env` });

// Internal Modules
const initServer = require('./initServer');
const app = require('./App');

// Set Server Port
const port = (process.env.PORT || 5050);
app.set('port', port);

// Set MongoDB Connection URL For Production
const mongoDbURI = process.env.DBURI;

// Init http Connection
const server = http.Server(app);

// Connect to MongoDB
mongoorm.connect(mongoDbURI, { useNewUrlParser: true }).then(function () {
  // Starting Express Server
  initServer.pre().then(function () {
    server.listen(port, function () {
      console.log(`Server Started at port ${port}`);
      initServer.post();
    });
  });
}).catch(function (error) {
  console.log(error)
});
