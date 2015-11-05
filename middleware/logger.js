"use strict";

var winston = require('winston'),
    path = require('path');
	
winston.emitErrs = true;

var logger = new winston.Logger({
  transports: [
      new winston.transports.File({
          level: 'info',
          filename: path.join(rootApp, '/logs/app.log'),
          maxsize: 5242880, //5MB
          colorize: true,
          datePattern: '.yyyy-MM-dd'
      }),
      new winston.transports.Console({
          level: 'debug',
          handleExceptions: true,
          json: false,
          colorize: true,
          timestamp: true
      })
  ],
  exitOnError: false
});
 
module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};