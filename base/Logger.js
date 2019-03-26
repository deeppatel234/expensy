/**
 * Error Reporting Service
 */
class Logger {
  constructor() {
    this.log = [];
  }

  error(err) {
    this.log.push(err);
    console.error(err);
  }

  info(msg) {
    this.log.push(msg);
    console.info(msg);
  }
}

module.exports = new Logger();
