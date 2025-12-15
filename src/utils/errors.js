/**
 * Classes d'erreurs personnalisées
 */

/**
 * Classe de base pour les erreurs personnalisées
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreur de validation
 */
export class ValidationError extends AppError {
  constructor(message = 'Erreur de validation', errors = null) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Erreur d'authentification
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentification requise') {
    super(message, 401);
  }
}

/**
 * Erreur d'autorisation
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Accès non autorisé') {
    super(message, 403);
  }
}

/**
 * Erreur ressource non trouvée
 */
export class NotFoundError extends AppError {
  constructor(message = 'Ressource non trouvée') {
    super(message, 404);
  }
}

/**
 * Erreur de conflit
 */
export class ConflictError extends AppError {
  constructor(message = 'Conflit avec une ressource existante') {
    super(message, 409);
  }
}

/**
 * Erreur de limite de requêtes
 */
export class RateLimitError extends AppError {
  constructor(message = 'Trop de requêtes') {
    super(message, 429);
  }
}

/**
 * Erreur de base de données
 */
export class DatabaseError extends AppError {
  constructor(message = 'Erreur de base de données') {
    super(message, 500, false);
  }
}

/**
 * Erreur interne du serveur
 */
export class InternalError extends AppError {
  constructor(message = 'Erreur interne du serveur') {
    super(message, 500, false);
  }
}
