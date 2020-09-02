import { transports, createLogger, format } from 'winston';

const logger = createLogger({
  format: format.combine(
    format.errors({ stack: true }),
    format.timestamp(),
    format.json(),
  ),
  transports: [new transports.Console()],
});

class DataVisLogger {
  static formatMessage(level, label, message, tid) {
    return {
      level,
      label,
      message,
      tid,
    };
  }

  static error(message, label, tid) {
    logger.log(DataVisLogger.formatMessage('error', label, message, tid));
  }

  static warn(message, label, tid) {
    logger.log(DataVisLogger.formatMessage('warn', label, message, tid));
  }

  static info(message, label, tid) {
    logger.log(DataVisLogger.formatMessage('info', label, message, tid));
  }

  static debug(message, label, tid) {
    logger.log(DataVisLogger.formatMessage('debug', label, message, tid));
  }
}

export default DataVisLogger;
