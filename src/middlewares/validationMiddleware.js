import Joi from 'joi';
import ApiResponse from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Middleware de validation avec Joi
 * @param {Joi.ObjectSchema} schema - Schéma Joi pour la validation
 * @param {string} property - Propriété à valider (body, query, params)
 */
export const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Retourner toutes les erreurs
      stripUnknown: true, // Supprimer les champs non définis dans le schéma
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/["]/g, ''),
        type: detail.type
      }));

      logger.warn('Erreur de validation', { 
        property, 
        errors,
        requestBody: req[property] 
      });

      return ApiResponse.validationError(
        res,
        errors,
        'Les données fournies sont invalides'
      );
    }

    // Remplacer les données validées et nettoyées
    req[property] = value;
    next();
  };
};

/**
 * Validation du body
 */
export const validateBody = (schema) => validateRequest(schema, 'body');

/**
 * Validation des query params
 */
export const validateQuery = (schema) => validateRequest(schema, 'query');

/**
 * Validation des params d'URL
 */
export const validateParams = (schema) => validateRequest(schema, 'params');

/**
 * Validation multiple (body + query + params)
 */
export const validateMultiple = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    // Valider le body
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });
      
      if (error) {
        errors.push(...error.details.map(detail => ({
          location: 'body',
          field: detail.path.join('.'),
          message: detail.message.replace(/["]/g, ''),
          type: detail.type
        })));
      } else {
        req.body = value;
      }
    }

    // Valider les query params
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });
      
      if (error) {
        errors.push(...error.details.map(detail => ({
          location: 'query',
          field: detail.path.join('.'),
          message: detail.message.replace(/["]/g, ''),
          type: detail.type
        })));
      } else {
        req.query = value;
      }
    }

    // Valider les params d'URL
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true
      });
      
      if (error) {
        errors.push(...error.details.map(detail => ({
          location: 'params',
          field: detail.path.join('.'),
          message: detail.message.replace(/["]/g, ''),
          type: detail.type
        })));
      } else {
        req.params = value;
      }
    }

    if (errors.length > 0) {
      logger.warn('Erreurs de validation multiples', { errors });
      return ApiResponse.validationError(
        res,
        errors,
        'Les données fournies sont invalides'
      );
    }

    next();
  };
};

/**
 * Validation conditionnelle
 */
export const validateConditional = (condition, schema, property = 'body') => {
  return (req, res, next) => {
    // Si la condition n'est pas remplie, passer au middleware suivant
    if (!condition(req)) {
      return next();
    }

    // Sinon, valider
    return validateRequest(schema, property)(req, res, next);
  };
};

/**
 * Schémas de validation communs réutilisables
 */
export const commonSchemas = {
  // Validation d'un ID MongoDB
  mongoId: Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID invalide',
        'string.empty': 'L\'ID est requis'
      })
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().default('-createdAt'),
    fields: Joi.string()
  }),

  // Recherche
  search: Joi.object({
    q: Joi.string().min(1).max(100),
    searchFields: Joi.string()
  }),

  // Filtres de date
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  }),

  // Email
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Email invalide',
      'string.empty': 'L\'email est requis'
    }),

  // Mot de passe
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
      'string.max': 'Le mot de passe ne peut pas dépasser 128 caractères',
      'string.empty': 'Le mot de passe est requis'
    })
};

/**
 * Helper pour créer des validateurs personnalisés
 */
export const createValidator = (schema, options = {}) => {
  return (req, res, next) => {
    const defaultOptions = {
      abortEarly: false,
      stripUnknown: true,
      ...options
    };

    const { error, value } = schema.validate(req.body, defaultOptions);

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/["]/g, ''),
        type: detail.type
      }));

      logger.warn('Erreur de validation personnalisée', { errors });

      return ApiResponse.validationError(
        res,
        errors,
        'Validation échouée'
      );
    }

    req.validatedData = value;
    next();
  };
};

// Export par défaut
export default {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
  validateMultiple,
  validateConditional,
  commonSchemas,
  createValidator
};
