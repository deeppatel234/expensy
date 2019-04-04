
// Library Imports
const mongoorm = require('mongoorm');
const http = require('http');

// set Environment variables
require('dotenv').config({ path: `${__dirname}/.env` });

// Internal Modules
const initServer = require('./initServer');

// Set Server Port
const port = (process.env.PORT || 5050);

// Set MongoDB Connection URL For Production
const mongoDbURI = process.env.DBURI;

// Connect to MongoDB
mongoorm.connect(mongoDbURI, { useNewUrlParser: true }).then(function () {
  // Starting Express Server
  initServer.pre().then(function () {

    const app = require('./app');
    app.set('port', port);

    // Init http Connection
    const server = http.Server(app);

    server.listen(port, function () {
      console.log(`Server Started at port ${port}`);
      initServer.post();
    });
  });
}).catch(function (error) {
  console.log(error)
});
