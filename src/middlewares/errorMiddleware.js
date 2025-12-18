import logger from '../utils/logger.js';
import ApiResponse from '../utils/response.js';

/**
 * Middleware de gestion des erreurs
 * @param {Error} err - Erreur
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 * @param {NextFunction} _next - Fonction next (non utilisée)
 */
export const errorMiddleware = (err, req, res, _next) => {
  // Log l'erreur
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Erreur Mongoose - Validation
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));

    return ApiResponse.validationError(res, errors, 'Erreur de validation des données');
  }

  // Erreur Mongoose - Cast (ID invalide)
  if (err.name === 'CastError') {
    const message = `Ressource non trouvée. ${err.path} invalide: ${err.value}`;
    return ApiResponse.badRequest(res, message);
  }

  // Erreur MongoDB - Duplicate key (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field} "${value}" existe déjà`;
    
    return res.status(409).json({
      success: false,
      message,
      field,
      value,
      timestamp: new Date().toISOString()
    });
  }

  // Erreur JWT - Token invalide
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Token invalide');
  }

  // Erreur JWT - Token expiré
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token expiré');
  }

  // Erreur de syntaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return ApiResponse.badRequest(res, 'JSON invalide dans la requête');
  }  

  // Erreur personnalisée avec statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      timestamp: new Date().toISOString()
    });
  }

  console.log("+++++++++v++++++++", process.env.NODE_ENV);

  // Erreur serveur par défaut (500)
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';
  console.log("0000000000000000000000000");


  return res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Une erreur est survenue' 
      : message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    }),
    timestamp: new Date().toISOString()
  });
};

/**
 * Middleware pour gérer les routes non trouvées (404)
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 * @param {NextFunction} _next - Fonction next (non utilisée)
 */
export const notFoundMiddleware = (req, res, _next) => {
  const message = `Route non trouvée: ${req.method} ${req.originalUrl}`;
  
  logger.warn(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  return ApiResponse.notFound(res, message);
};

/**
 * Gestionnaire d'erreurs asynchrones non capturées
 * À appeler dans server.js
 */
export const handleUncaughtErrors = () => {
  // Erreurs non capturées (synchrones)
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Arrêt du serveur...', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    // Arrêter le processus proprement
    process.exit(1);
  });

  // Promesses rejetées non gérées (asynchrones)
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Arrêt du serveur...', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    // Arrêter le processus proprement
    process.exit(1);
  });

  // Signal d'arrêt propre (Ctrl+C)
  process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM reçu. Arrêt propre du serveur...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('👋 SIGINT reçu. Arrêt propre du serveur...');
    process.exit(0);
  });
};

/**
 * Wrapper pour les fonctions asynchrones
 * Évite les try/catch répétitifs dans les controllers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Classe d'erreur personnalisée
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreurs courantes pré-définies
 */
export const ErrorTypes = {
  ValidationError: (message) => new AppError(message, 400),
  UnauthorizedError: (message = 'Non autorisé') => new AppError(message, 401),
  ForbiddenError: (message = 'Accès interdit') => new AppError(message, 403),
  NotFoundError: (message = 'Ressource non trouvée') => new AppError(message, 404),
  ConflictError: (message = 'Conflit de données') => new AppError(message, 409),
  TooManyRequestsError: (message = 'Trop de requêtes') => new AppError(message, 429),
  InternalError: (message = 'Erreur interne du serveur') => new AppError(message, 500),
  ServiceUnavailableError: (message = 'Service indisponible') => new AppError(message, 503)
};

// Export par défaut
export default {
  errorMiddleware,
  notFoundMiddleware,
  handleUncaughtErrors,
  asyncHandler,
  AppError,
  ErrorTypes
};
