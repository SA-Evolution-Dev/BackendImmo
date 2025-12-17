import Joi from 'joi';

/**
 * Schéma de validation pour l'inscription
 */
export const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Le nom est requis',
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 50 caractères'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'L\'email est requis',
      'string.email': 'L\'email doit être valide'
    }),
  
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Le mot de passe est requis',
      'string.min': 'Le mot de passe doit contenir au moins 6 caractères'
    }),
  
  role: Joi.string()
    .required()
    .valid('user', 'client', 'admin')
    // .default('user')
});



/**
 * Schéma de validation pour la connexion
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'L\'email est requis',
      'string.email': 'L\'email doit être valide'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Le mot de passe est requis'
    })
});












/**
 * Schéma de validation pour la mise à jour du profil
 */
export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 50 caractères'
    }),
  
  email: Joi.string()
    .email()
    .messages({
      'string.email': 'L\'email doit être valide'
    })
}).min(1); // Au moins un champ doit être fourni

/**
 * Schéma de validation pour le changement de mot de passe
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Le mot de passe actuel est requis'
    }),
  
  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Le nouveau mot de passe est requis',
      'string.min': 'Le nouveau mot de passe doit contenir au moins 6 caractères'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Les mots de passe ne correspondent pas',
      'string.empty': 'La confirmation du mot de passe est requise'
    })
});

/**
 * Schéma de validation pour la mise à jour du rôle (Admin)
 */
export const updateRoleSchema = Joi.object({
  role: Joi.string()
    .valid('user', 'admin', 'moderator')
    .required()
    .messages({
      'string.empty': 'Le rôle est requis',
      'any.only': 'Le rôle doit être: user, admin ou moderator'
    })
});

/**
 * Schéma de validation pour la mise à jour d'un utilisateur (Admin)
 */
export const updateUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 50 caractères'
    }),
  
  email: Joi.string()
    .email()
    .messages({
      'string.email': 'L\'email doit être valide'
    }),
  
  isActive: Joi.boolean()
    .messages({
      'boolean.base': 'isActive doit être un booléen'
    }),
  
  role: Joi.string()
    .valid('user', 'admin', 'moderator')
    .messages({
      'any.only': 'Le rôle doit être: user, admin ou moderator'
    })
}).min(1); // Au moins un champ doit être fourni

/**
 * Schéma de validation pour l'ID utilisateur
 */
export const userIdSchema = Joi.object({
  id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'L\'ID est requis',
      'string.pattern.base': 'L\'ID doit être un ObjectId MongoDB valide'
    })
});

/**
 * Schéma de validation pour la réinitialisation du mot de passe
 */
export const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Le mot de passe est requis',
      'string.min': 'Le mot de passe doit contenir au moins 6 caractères'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Les mots de passe ne correspondent pas',
      'string.empty': 'La confirmation du mot de passe est requise'
    })
});

/**
 * Schéma de validation pour l'email (mot de passe oublié)
 */
export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'L\'email est requis',
      'string.email': 'L\'email doit être valide'
    })
});

/**
 * Schéma de validation pour le refresh token
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'string.empty': 'Le refresh token est requis'
    })
});

// Export par défaut de tous les schémas
export default {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  updateRoleSchema,
  updateUserSchema,
  userIdSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  refreshTokenSchema
};
