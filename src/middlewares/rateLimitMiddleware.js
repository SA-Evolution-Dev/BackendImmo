import rateLimit from 'express-rate-limit';
import config from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Configuration du rate limiting global
 * Limite: 100 requêtes par 15 minutes (configurable via env)
 */
export const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    logger.warn('[Rate Limit] Limite globale dépassée');
    res.status(429).json({
      success: false,
      message: 'Trop de requêtes, veuillez réessayer plus tard',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Rate limiting strict pour l'authentification
 * Limite: 5 tentatives par 15 minutes
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Trop de tentatives, veuillez réessayer dans 15 minutes',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    logger.warn('[Rate Limit] Limite stricte dépassée (auth)');
    res.status(429).json({
      success: false,
      message: 'Trop de tentatives de connexion',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Rate limiting pour les API publiques
 * Limite: 30 requêtes par minute
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    message: 'Limite d\'API atteinte',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    logger.warn('[Rate Limit] Limite API dépassée');
    res.status(429).json({
      success: false,
      message: 'Limite d\'API atteinte, ralentissez vos requêtes',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Rate limiting pour les uploads de fichiers
 * Limite: 10 uploads par heure
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10,
  message: {
    success: false,
    message: 'Limite d\'uploads atteinte',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    logger.warn('[Rate Limit] Limite upload dépassée');
    res.status(429).json({
      success: false,
      message: 'Trop d\'uploads, réessayez dans une heure',
      retryAfter: '1 heure',
      timestamp: new Date().toISOString()
    });
  }
});

export default limiter;