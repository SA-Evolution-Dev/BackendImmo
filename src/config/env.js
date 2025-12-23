import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
const envPath = join(__dirname, '../../.env');

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️  Fichier .env non trouvé. Utilisation des valeurs par défaut.');
}

/**
 * Configuration centralisée de l'application
 */
const config = {
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  appName: process.env.APP_NAME || 'MyAPI',
  appUrl: process.env.APP_URL || 'http://localhost:5000',

  // Database
  mongoUri: process.env.NODE_ENV === 'test' ? process.env.MONGODB_URI_TEST : process.env.MONGODB_URI,
  dbName: process.env.DB_NAME || 'myapi',

  // JWT
  jwtSecret: process.env.JWT_ACCESS_SECRET,
  jwtAccessExpire: process.env.JWT_ACCESS_EXPIRES_IN || 900,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  jwtCookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE || 604800, 10),

  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
  lockTime: process.env.LOCK_TIME || '2h',
  encryptKey: process.env.ENCRYPTION_KEY || 'IMxM4O45oaiQdonflVsKCnnu8Ai7yUpp',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  corsCredentials: process.env.CORS_CREDENTIALS || 'true',

  // Rate Limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  rateLimitSkipSuccess: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',

  // Pagination
  defaultPage: parseInt(process.env.DEFAULT_PAGE || '1', 10),
  defaultLimit: parseInt(process.env.DEFAULT_LIMIT || '10', 10),
  maxLimit: parseInt(process.env.MAX_LIMIT || '100', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',
  logFileMaxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
  logFileMaxFiles: process.env.LOG_FILE_MAX_FILES || '14d',

  // Email (optionnel)
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  emailFrom: process.env.EMAIL_FROM || 'noreply@myapi.com',

  // GED
  gedApiUrl: process.env.GED_API_URL,
  gedApiKey: process.env.GED_API_KEY,

  // Redis (optionnel)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
};

/**
 * Validation des variables d'environnement critiques
 */
const validateConfig = () => {
  const requiredVars = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

  if (config.nodeEnv === 'production') {
    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Variables d'environnement manquantes en production: ${missingVars.join(', ')}`
      );
    }

    // Vérifier la longueur minimale des secrets
    if (process.env.JWT_ACCESS_SECRET.length < 32) {
      throw new Error('JWT_ACCESS_SECRET doit contenir au moins 32 caractères');
    }

    if (process.env.JWT_REFRESH_SECRET.length < 32) {
      throw new Error('JWT_REFRESH_SECRET doit contenir au moins 32 caractères');
    }
  } else {
    // En développement, générer des secrets si absents
    if (!config.jwtSecret) {
      console.warn('JWT_REFRESH_SECRET non défini. Génération d\'un secret temporaire.');
      config.jwtSecret = 'dev_jwt_secret_' + Math.random().toString(36).substring(2);
    }

    if (!config.jwtRefreshSecret) {
      console.warn('JWT_REFRESH_SECRET non défini. Génération d\'un secret temporaire.');
      config.jwtRefreshSecret = 'dev_refresh_secret_' + Math.random().toString(36).substring(2);
    }
  }
};

// Valider la configuration
validateConfig();

export default config;
