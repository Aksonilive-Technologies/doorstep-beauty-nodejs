// // utils/logger.js
// const { createLogger, format, transports } = require('winston');
// const { combine, timestamp, printf, colorize } = format;

// // Define custom log format
// const logFormat = printf(({ level, message, timestamp, stack }) => {
//   return `${timestamp} [${level}]: ${stack || message}`;
// });

// // Create the logger instance
// const logger = createLogger({
//   level: 'info', // Set the default log level (can be adjusted)
//   format: combine(
//     timestamp(), // Add timestamps to logs
//     colorize(),  // Colorize log output
//     logFormat    // Use custom format for logs
//   ),
//   transports: [
//     // Console transport for development
//     new transports.Console(),

//     // File transport for persistent logs
//     new transports.File({ filename: 'logs/error.log', level: 'error' }),
//     new transports.File({ filename: 'logs/combined.log' })
//   ],
// });

// // Export the logger instance
// export default logger;
