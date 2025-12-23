import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import crypto from 'crypto';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid'

// ═══════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════

const userSchema = new mongoose.Schema({
    identityKey: {
      type: String,
      unique: true,
      required: true,
      default: function() { return uuidv4(); },
      immutable: true,
      index: true
    },
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
        values: ['user', 'client', 'master'],
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
    refreshTokens: [{
      token: {
        type: String,
        required: true,
      },
      expiresAt: {
        type: Date,
        required: true,
        index: true, // Index pour performance
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      userAgent: {
        type: String,
        default: 'Unknown Device',
      },
      ip: {
        type: String,
        default: null,
      },
    }],
     emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationTokenExpires: {
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
        delete ret.refreshTokens;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.__v;
        delete ret._id;
        delete ret.id;
        return ret;
      }
    },
    toObject: { virtuals: true },
  }
);

// ═══════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════

// userSchema.index({ email: 1, isActive: 1 });
// userSchema.index({ createdAt: -1 });
// userSchema.index({ 'refreshTokens.expiresAt': 1 });

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

userSchema.methods.addRefreshToken = async function (token, expiresAt, userAgent = '', ip = '') {
  try {
    // Ajouter le nouveau token
    this.refreshTokens.push({
      token,
      expiresAt,
      userAgent,
      ip,
      createdAt: new Date(),
    });

    // Limiter à 5 tokens maximum (garder les plus récents)
    if (this.refreshTokens.length > 5) {
      // Trier par date de création (plus récent en premier)
      this.refreshTokens.sort((a, b) => b.createdAt - a.createdAt);
      // Garder seulement les 5 plus récents
      this.refreshTokens = this.refreshTokens.slice(0, 5);
    }

    await this.save();
    
    return this;
  } catch (error) {
    logger.error('Erreur lors de la comparaison du mot de passe:', error);
    throw new Error('Erreur lors de l\'ajout du refresh token');
  }
};

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

// Méthode pour générer un token de vérification
userSchema.methods.generateVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = token;
  this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures
  return token;
};

// Méthode pour vérifier si le token est valide
userSchema.methods.isVerificationTokenValid = function() {
  return this.verificationTokenExpires && this.verificationTokenExpires > new Date();
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

const User = mongoose.model('User', userSchema);

export default User;
