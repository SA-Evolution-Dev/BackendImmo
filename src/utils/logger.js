import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Définir les niveaux de log personnalisés
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Définir les couleurs pour chaque niveau
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Format pour la console
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let msg = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return msg;
  })
);

// Transport pour les erreurs (rotation quotidienne)
const errorFileTransport = new DailyRotateFile({
  filename: join(__dirname, '../../logs/error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: config.logFileMaxSize,
  maxFiles: config.logFileMaxFiles,
  format: customFormat,
  zippedArchive: true,
});

// Transport pour tous les logs (rotation quotidienne)
const combinedFileTransport = new DailyRotateFile({
  filename: join(__dirname, '../../logs/combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: config.logFileMaxSize,
  maxFiles: config.logFileMaxFiles,
  format: customFormat,
  zippedArchive: true,
});

// Transport pour la console
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
  level: config.logLevel,
});

// Créer le logger
const logger = winston.createLogger({
  levels,
  level: config.logLevel,
  format: customFormat,
  transports: [consoleTransport],
  exitOnError: false,
  silent: config.nodeEnv === 'test',
});

// Ajouter les transports de fichiers seulement en production et développement
if (config.nodeEnv !== 'test') {
  logger.add(errorFileTransport);
  logger.add(combinedFileTransport);
}

// Stream pour Morgan (logging HTTP)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Méthodes utilitaires
logger.logRequest = (req) => {
  logger.http('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
};

logger.logResponse = (req, res, duration) => {
  logger.http('Outgoing response', {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    duration: `${duration}ms`,
  });
};

export default logger;
