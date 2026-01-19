import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid'

const annonceSchema = new mongoose.Schema({
    key: {
        type: String,
        unique: true,
        required: true,
        default: function () { return uuidv4(); },
        immutable: true,
        index: true
    },
    reference: {
        type: String,
        unique: true,
        required: true,
    },
    statut: {
        type: String,
        enum: {
            values: ['brouillon', 'actif', 'termine', 'retire'],
            message: '{VALUE} n\'est pas un statut valide',
        },
        default: 'brouillon',
    },
    title: {
        type: String, 
        required: true 
    },
    description: {
        type: String, 
        required: true 
    },
    contact: {
        nom: { type: String, required: true },
        telephone: { type: String, required: true },
        email: { type: String, required: true }
    },
    // 📍 SECTION LOCALISATION - Toutes les informations géographiques du bien
    localisation: {
        ville: { type: String, required: false },
        commune: { type: String, required: false },
        adresse: { type: String, required: false },
        latitude: { type: Number, min: -90, max: 90, default: null },
        longitude: { type: Number, min: -180, max: 180, default: null },
    },
    type: {
        type: String,
        enum: {
            values: ['appartement', 'villa', 'studio', 'bureau'],
            message: '{VALUE} n\'est pas un type de bien valide',
        },
        required: true 
    },
    // 🏘️ SECTION COMPOSITION - Nombre et type de pièces du bien
    composition: {
        nombreChambres: {
            type: Number,
            required: true,
            min: 0
        },
        nombreSalons: {
            type: Number,
            required: true,
            min: 0
        },
        nombrePieces: {
            type: Number,
            required: true,
            min: 1
        },
        nombreSallesBain: {
            type: Number,
            required: true,
            min: 0
        },
        nombreCuisine: {
            type: Number,
            required: true,
            min: 0
        },
        toilettesVisiteurs: {
            type: Boolean,
            required: false,
        },
    },
    // 🛠️ SECTION ÉQUIPEMENTS INTÉRIEURS - Tous les équipements et aménagements internes
    equipementsInterieurs: {
        cuisineEquipee: {
            type: Boolean,
            required: false,
        },
        baignoire: {
            type: Boolean,
            required: false,
        },
        jacuzzi: {
            type: Boolean,
            required: false,
        },
        climatisation: {
            type: Boolean,
            required: false,
        },
        placard: {
            type: Boolean,
            required: false,
        },
        chauffeEau: {
            type: Boolean,
            required: false,
        },
        fibreOptique: {
            type: Boolean,
            required: false,
        },
    },
    // 🌳 SECTION ÉQUIPEMENTS EXTÉRIEURS - Aménagements et espaces extérieurs
    equipementsExterieurs: {
        jardin: {
            type: Boolean,
            default: false
        },
        cour: {
            type: Boolean,
            default: false
        },
        piscine: {
            type: Boolean,
            default: false
        },
        parking: {
            type: Boolean,
            default: false
        },
        garage: {
            type: Boolean,
            default: false
        },
        balcon: {
            type: Boolean,
            default: false
        },
        terrasse: {
            type: Boolean,
            default: false
        },
        groupeElectrogene: {
            type: Boolean,
            default: false
        },
        gardien: {
            type: Boolean,
            default: false
        }
    },
    // 💰 SECTION INFORMATIONS COMMERCIALES - Tout ce qui concerne le prix et la transaction
    transaction: {
        transactionType: {
            type: String,
            enum: {
                values: ['vente', 'location'],
                message: '{VALUE} n\'est pas un transactionType valide',
            },
            required: true,
        },
        prix: {
            type: Number,
            required: true,
        },
        periodeLoyer: {
            type: String,
            enum: ['MOIS', 'ANNUEL'],
            required: function () {
            return this.typeTransaction !== 'vente'
            }
        },
        devise: {
            type: String,
            required: false,
            default: 'FCFA',
        },
        prixNegociable: {
            type: Boolean,
            required: false,
            default: false,
        },
        caution: {
            type: Number, // nombre de mois
            default: 0
        },
        avance: {
            type: Number, // nombre de mois
            default: 0
        }
    },
    // 🏢 SECTION CARACTÉRISTIQUES DU BÂTIMENT - Informations sur l'immeuble et la construction
    batiment: {
        anneeConstruction: {
            type: Number,
            min: 1900,
            max: new Date().getFullYear()
        },
        etatConstruction: {
            type: String,
            enum: [
                'neuf',
                'bon',
                'renove',
                'a-renover',
                'en-construction'
            ]
        },
        typeConstruction: {
            type: String,
            enum: [
                'traditionnel',
                'semi-moderne',
                'moderne'
            ]
        }
    },
    medias: [],
    visibilite: {
        niveau: {
            type: String,
            enum: ['normal', 'exclusif'],
            default: 'normal'
        },

        enVedette: {
            type: Boolean,
            default: false
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

annonceSchema.methods.test1 = async function () {
    try {
        this.refreshTokens = this.refreshTokens.slice(0, 5);
        await this.save();

        return this;
    } catch (error) {
        logger.error('Erreur lors de la comparaison du mot de passe:', error);
        throw new Error('Erreur lors de l\'ajout du refresh token');
    }
};

annonceSchema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// ═══════════════════════════════════════════════════
// STATICS
// ═══════════════════════════════════════════════════

annonceSchema.statics.findActiveByEmail = function (name) {
    return this.findOne({ name });
};

const Annonce = mongoose.model('Annonce', annonceSchema);

export default Annonce;
