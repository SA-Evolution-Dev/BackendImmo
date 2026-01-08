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
            values: ['appartement', 'villa', 'studio'],
            message: '{VALUE} n\'est pas un type de bien valide',
        },
        required: true 
    },
    // 🏘️ SECTION COMPOSITION - Nombre et type de pièces du bien
    composition: {
        nombrePieces: {
            type: Number,
            required: true,
        },
        nombreChambres: {
            type: Number,
            required: true,
        },
        nombreSallesBain: {
            type: Number,
            required: true,
        },
        nombreSalons: {
            type: Number,
            required: true,
        },
        balcon: {
            type: Boolean,
            required: false,
        },
        salleManger: {
            type: Boolean,
            required: false,
        },
        parking: {
            type: Boolean,
            required: false,
        },
        garage: {
            type: Boolean,
            required: false,
        },
        gardien: {
            type: Boolean,
            required: false,
        },
    },
    // 💰 SECTION INFORMATIONS COMMERCIALES - Tout ce qui concerne le prix et la transaction
    transaction: {
        typeTransaction: {
            type: String,
            enum: {
                values: ['vente', 'location', 'location-vente'],
                message: '{VALUE} n\'est pas un typeTransaction valide',
            },
            required: true,
        },
        prix: {
            type: Number,
            required: true,
        },
        periode: { //  nest disponible que si nous somme dans un cas de location
            type: String,
            enum: {
                values: ['MOIS', 'ANNUEL'],
                message: '{VALUE} n\'est pas un periode valide',
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
            type: String,
            required: false,
            default: false,
        },
        avance: {
            type: String,
            required: false,
            default: false,
        }
    },
    // 🏢 SECTION CARACTÉRISTIQUES DU BÂTIMENT - Informations sur l'immeuble et la construction
    batiment: {
        anneConstruction: {
            type: String,
            required: false,
        },
        etatConstruction: {
            type: String,
            enum: {
                values: ['neuf', 'bon', 'a-renover', 'en-construction'],
                message: '{VALUE} n\'est pas un etatConstruction valide',
            },
            required: false,
        },
        typeConstruction: {
            type: String,
            enum: {
                values: ['traditionnel', 'moderne'],
                message: '{VALUE} n\'est pas un typeConstruction valide',
            },
            required: false,
        },
    },    
    // 🛠️ SECTION ÉQUIPEMENTS INTÉRIEURS - Tous les équipements et aménagements internes
    equipementsInterieurs: {
        cuisineEquipee: {
            type: Boolean,
            required: false,
        },
        refrigerateur: {
            type: Boolean,
            required: false,
        },
        microOndes: {
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
        }
    },
    // 🌳 SECTION ÉQUIPEMENTS EXTÉRIEURS - Aménagements et espaces extérieurs
    equipementsExterieurs: {
        jardin: {
            type: Boolean,
            required: false,
        },
        piscine: {
            type: Boolean,
            required: false,
        }
    },
    // 📸 SECTION MÉDIAS
    medias: {
        photos: [],
        videos: [],
    },
    // 🎯 SECTION RÉFÉRENCEMENT & VISIBILITÉ - Options de promotion et mise en avant
    visibilite: {
        normal: {
            type: Boolean,
            required: true,
            default: true,
        },
        exclusif: {
            type: Boolean,
            required: true,
            default: false,
        },
        enVedette: {
            type: Boolean,
            required: true,
            default: false,
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
