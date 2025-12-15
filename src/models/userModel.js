import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import crypto from 'crypto'; // ✅ Import en haut du fichier
import config from '../config/env.js';
import logger from '../utils/logger.js';

// ═══════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: 'Email invalide',
      },
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin', 'moderator'],
        message: '{VALUE} n\'est pas un rôle valide',
      },
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true },
  }
);

// ═══════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════

userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

// ═══════════════════════════════════════════════════
// MIDDLEWARES
// ═══════════════════════════════════════════════════

/**
 * Hash du mot de passe avant sauvegarde
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(config.bcryptRounds);
    this.password = await bcrypt.hash(this.password, salt);
    logger.debug(`Mot de passe hashé pour l'utilisateur: ${this.email}`);
    next();
  } catch (error) {
    logger.error('Erreur lors du hashage du mot de passe:', error);
    next(error);
  }
});

/**
 * Logger avant suppression
 */
userSchema.pre('findOneAndDelete', async function (next) {
  try {
    const user = await this.model.findOne(this.getFilter());
    if (user) {
      logger.info(`Suppression de l'utilisateur: ${user.email}`);
    }
    next();
  } catch (error) {
    logger.error('Erreur lors de la suppression:', error);
    next(error);
  }
});

// ═══════════════════════════════════════════════════
// METHODS
// ═══════════════════════════════════════════════════

/**
 * Comparer le mot de passe
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    logger.error('Erreur lors de la comparaison du mot de passe:', error);
    throw new Error('Erreur lors de la comparaison du mot de passe');
  }
};

/**
 * Générer un token de réinitialisation de mot de passe
 */
userSchema.methods.generateResetToken = function () {
  // Générer un token aléatoire
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hasher le token avant de le stocker
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Définir l'expiration (1 heure)
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

  // Retourner le token non hashé (pour l'envoyer par email)
  return resetToken;
};

/**
 * Mettre à jour la dernière connexion
 */
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
};

/**
 * Vérifier si le compte est verrouillé
 */
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// ═══════════════════════════════════════════════════
// STATICS
// ═══════════════════════════════════════════════════

/**
 * Trouver un utilisateur actif par email
 */
userSchema.statics.findActiveByEmail = function (email) {
  return this.findOne({ email, isActive: true });
};

/**
 * Compter les utilisateurs par rôle
 */
userSchema.statics.countByRole = function () {
  return this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
  ]);
};

/**
 * Trouver un utilisateur par son token de réinitialisation
 */
userSchema.statics.findByResetToken = function (resetToken) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  return this.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
};

// ═══════════════════════════════════════════════════
// MODEL
// ═══════════════════════════════════════════════════

const User = mongoose.model('User', userSchema);

export default User;
