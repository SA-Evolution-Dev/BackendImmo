import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import User from '../models/userModel.js';
import ApiResponse from '../utils/response.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Protéger les routes - Vérifier le token JWT
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Récupérer le token depuis le header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Ou depuis les cookies
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  // Vérifier si le token existe
  if (!token) {
    logger.warn('Tentative d\'accès sans token', {
      ip: req.ip,
      url: req.originalUrl,
    });
    throw new AuthenticationError('Non autorisé - Token manquant');
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, config.jwtSecret);

    console.log("lal ++++++ ttoken decode", decoded);
    

    // Récupérer l'utilisateur
    const user = await User.findByIdentityKey(decoded.id);

    if (!user) {
      logger.warn('Token valide mais utilisateur introuvable', {
        userId: decoded.id,
      });
      throw new AuthenticationError('L\'utilisateur n\'existe plus');
    }

    // Vérifier si l'utilisateur est actif
    if (!user.isActive) {
      logger.warn('Tentative d\'accès avec compte désactivé', {
        userId: user._id,
        email: user.email,
      });
      throw new AuthenticationError('Compte désactivé');
    }

    // Vérifier si l'utilisateur a changé son mot de passe après l'émission du token
    if (user.changedPasswordAfter(decoded.iat)) {
      logger.warn('Token émis avant changement de mot de passe', {
        userId: user._id,
      });
      throw new AuthenticationError(
        'Mot de passe récemment modifié - Veuillez vous reconnecter'
      );
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token expiré', { error: error.message });
      return ApiResponse.unauthorized(res, 'Token expiré');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Token invalide', { error: error.message });
      return ApiResponse.unauthorized(res, 'Token invalide');
    }

    throw error;
  }
});

/**
 * Vérifier les rôles de l'utilisateur
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError('Non authentifié');
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Accès refusé - Rôle insuffisant', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roles,
      });
      throw new AuthorizationError(
        'Vous n\'avez pas la permission d\'effectuer cette action'
      );
    }

    next();
  };
};

/**
 * Middleware optionnel - Ajoute l'utilisateur si authentifié, sinon continue
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtAccessSecret);
    const user = await User.findById(decoded.id).select('-password');

    if (user && user.isActive && !user.changedPasswordAfter(decoded.iat)) {
      req.user = user;
    }
  } catch (error) {
    // Ignorer les erreurs et continuer sans utilisateur
    logger.debug('Auth optionnelle échouée', { error: error.message });
  }

  next();
});

/**
 * Vérifier que l'utilisateur accède à ses propres ressources
 */
export const checkOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError('Non authentifié');
    }

    // Les admins peuvent tout faire
    if (req.user.role === 'admin') {
      return next();
    }

    // Vérifier l'ownership
    const resourceUserId =
      req.params[resourceUserIdField] ||
      req.body[resourceUserIdField] ||
      req.query[resourceUserIdField];

    if (!resourceUserId) {
      throw new AuthorizationError('ID de ressource manquant');
    }

    if (resourceUserId.toString() !== req.user._id.toString()) {
      logger.warn('Tentative d\'accès à une ressource non autorisée', {
        userId: req.user._id,
        resourceUserId,
      });
      throw new AuthorizationError(
        'Vous ne pouvez accéder qu\'à vos propres ressources'
      );
    }

    next();
  };
};
