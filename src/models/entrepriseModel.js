import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid'

const entrepriseSchema = new mongoose.Schema({
    key: {
        type: String,
        unique: true,
        required: true,
        default: function () { return uuidv4(); },
        immutable: true,
        index: true
    },
    corporateName: {
        type: String,
        required: [true, 'Le nom est requis'],
        trim: true,
        minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
        maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    //     Badge :
    // ✅ Agence vérifiée
    // ⚠️ Agence non vérifiée
    rccm: {
        type: String,
    },
    descripton: {
        type: String,
    },
    adresse: {
        type: String,
    },
    phone: {
        type: String,
    },
    otherPhone: {
        type: String,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    responsableKey: {
        type: String,
        required: [true, "L'identifiant du responsable est obligatoire"],
    },
    usersList: {
        type: [{}]
    },
    logoFile: {
        original_name: {
            type: String,
        },
        filename: {
            type: String,
        },
        size: {
            type: Number,
        },
        size_formatted: {
            type: String,
        },
        mime_type: {
            type: String,
        },
        path: {
            type: String,
        },
        full_path: {
            type: String,
        },
        url: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        }
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
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
});


// ═══════════════════════════════════════════════════
// METHODS
// ═══════════════════════════════════════════════════

entrepriseSchema.methods.test1 = async function () {
    try {
        this.refreshTokens = this.refreshTokens.slice(0, 5);
        await this.save();

        return this;
    } catch (error) {
        logger.error('Erreur lors de la comparaison du mot de passe:', error);
        throw new Error('Erreur lors de l\'ajout du refresh token');
    }
};

entrepriseSchema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// ═══════════════════════════════════════════════════
// STATICS
// ═══════════════════════════════════════════════════

entrepriseSchema.statics.findActiveByEmail = function (name) {
    return this.findOne({ name });
};

const Entreprise = mongoose.model('Entreprise', entrepriseSchema);

export default Entreprise;
