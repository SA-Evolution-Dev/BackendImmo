import Joi from 'joi';

// Helper pour créer des champs qui acceptent string ou objet
const stringOrObject = (objectSchema) => {
    return Joi.alternatives().try(
        Joi.string().custom((value, helpers) => {
            try {
                const parsed = JSON.parse(value);
                const { error, value: validated } = objectSchema.validate(parsed);
                if (error) return helpers.error('any.invalid');
                return validated;
            // eslint-disable-next-line no-unused-vars
            } catch (error) {
                return helpers.error('any.invalid');
            }
        }),
        objectSchema
    );
};

export const adCreateSchema = Joi.object({
    title: Joi.string()
        .min(10)
        .max(200)
        .required()
        .messages({
            'string.empty': 'Le titre est requis',
            'string.min': 'Le titre doit contenir au moins 10 caractères',
            'string.max': 'Le titre ne peut pas dépasser 200 caractères'
        }),

    description: Joi.string()
        .max(2500)
        .required()
        .messages({
            'string.empty': 'La description est requise',
            'string.min': 'La description doit contenir au moins 50 caractères',
            'string.max': 'La description ne peut pas dépasser 2500 caractères'
        }),

    // 📞 Contact
    contact: stringOrObject(
        Joi.object({
            nom: Joi.string()
                .required()
                .min(2)
                .messages({
                    'string.empty': 'Le nom du contact est requis',
                    'string.min': 'Le nom doit contenir au moins 2 caractères',
                    'any.required': 'Le nom du contact est requis'
                }),

            telephone: Joi.string()
                .required()
                .pattern(/^[0-9+\s-()]+$/)
                .min(8)
                .messages({
                    'string.empty': 'Le téléphone est requis',
                    'string.pattern.base': 'Le numéro de téléphone est invalide',
                    'string.min': 'Le téléphone doit contenir au moins 8 chiffres',
                    'any.required': 'Le téléphone est requis'
                }),

            email: Joi.string()
                .email()
                .required()
                .messages({
                    'string.empty': 'L\'email est requis',
                    'string.email': 'L\'email doit être valide',
                    'any.required': 'L\'email est requis'
                }),

            whatsapp: Joi.string()
                .pattern(/^[0-9+\s-()]+$/)
                .optional()
                .allow('', null)
                .messages({
                    'string.pattern.base': 'Le numéro WhatsApp est invalide'
                })
        }).unknown(false) // ⚠️ Rejeter les champs non définis
    ).required()
    .messages({
        'alternatives.types': 'Les informations de contact doivent être valides',
        'any.required': 'Les informations de contact sont requises',
        'any.invalid': 'Les données de contact sont invalides'
    }),

    // localisation: Joi.object({
    //     ville: Joi.string()
    //         .required()
    //         .max(100)
    //         .messages({
    //             'string.max': 'Le nom de la ville ne peut pas dépasser 100 caractères'
    //         }),

    //     commune: Joi.string()
    //         .allow('', null)
    //         .max(100)
    //         .messages({
    //             'string.max': 'Le nom de la commune ne peut pas dépasser 100 caractères'
    //         }),

    //     adresse: Joi.string()
    //         .allow('', null)
    //         .max(200)
    //         .messages({
    //             'string.max': 'L\'adresse ne peut pas dépasser 200 caractères'
    //         }),

    //     latitude: Joi.number()
    //         .allow(null)
    //         .messages({
    //             'number.min': 'La latitude doit être entre -90 et 90',
    //             'number.max': 'La latitude doit être entre -90 et 90'
    //         }),

    //     longitude: Joi.number()
    //         .allow(null)
    //         .messages({
    //             'number.min': 'La longitude doit être entre -180 et 180',
    //             'number.max': 'La longitude doit être entre -180 et 180'
    //         })
    // }).required(),

    type: Joi.string()
        .valid('appartement', 'villa', 'studio', 'bureau')
        .required()
        .messages({
            'string.empty': 'Le type de bien est requis',
            'any.only': 'Le type de bien doit être: appartement, villa, studio ou bureau'
        }),

    // 🏠 Composition
    composition: stringOrObject(
        Joi.object({
            nombreChambres: Joi.alternatives()
                .try(
                    Joi.number().integer().min(0),
                    Joi.string()
                        .pattern(/^\d+$/)
                        .custom((value, helpers) => {
                            const num = parseInt(value, 10);
                            if (num < 0) return helpers.error('number.min');
                            return num;
                        })
                )
                .required()
                .messages({
                    'number.base': 'Le nombre de chambres doit être un nombre',
                    'number.integer': 'Le nombre de chambres doit être un nombre entier',
                    'number.min': 'Le nombre de chambres ne peut pas être négatif',
                    'any.required': 'Le nombre de chambres est requis',
                    'string.pattern.base': 'Le nombre de chambres doit être un nombre valide'
                }),

            nombreSalons: Joi.alternatives()
                .try(
                    Joi.number().integer().min(0),
                    Joi.string()
                        .pattern(/^\d+$/)
                        .custom((value, helpers) => {
                            const num = parseInt(value, 10);
                            if (num < 0) return helpers.error('number.min');
                            return num;
                        })
                )
                .required()
                .messages({
                    'number.base': 'Le nombre de salons doit être un nombre',
                    'number.integer': 'Le nombre de salons doit être un nombre entier',
                    'number.min': 'Le nombre de salons ne peut pas être négatif',
                    'any.required': 'Le nombre de salons est requis',
                    'string.pattern.base': 'Le nombre de salons doit être un nombre valide'
                }),

            nombreSallesBain: Joi.alternatives()
                .try(
                    Joi.number().integer().min(0),
                    Joi.string()
                        .pattern(/^\d+$/)
                        .custom((value, helpers) => {
                            const num = parseInt(value, 10);
                            if (num < 0) return helpers.error('number.min');
                            return num;
                        })
                )
                .required()
                .messages({
                    'number.base': 'Le nombre de salles de bain doit être un nombre',
                    'number.integer': 'Le nombre de salles de bain doit être un nombre entier',
                    'number.min': 'Le nombre de salles de bain ne peut pas être négatif',
                    'any.required': 'Le nombre de salles de bain est requis',
                    'string.pattern.base': 'Le nombre de salles de bain doit être un nombre valide'
                }),

            nombreCuisine: Joi.alternatives()
                .try(
                    Joi.number().integer().min(0),
                    Joi.string()
                        .pattern(/^\d+$/)
                        .custom((value, helpers) => {
                            const num = parseInt(value, 10);
                            if (num < 0) return helpers.error('number.min');
                            return num;
                        })
                )
                .required()
                .messages({
                    'number.base': 'Le nombre de cuisines doit être un nombre',
                    'number.integer': 'Le nombre de cuisines doit être un nombre entier',
                    'number.min': 'Le nombre de cuisines ne peut pas être négatif',
                    'any.required': 'Le nombre de cuisines est requis',
                    'string.pattern.base': 'Le nombre de cuisines doit être un nombre valide'
                }),

            toilettesVisiteurs: Joi.alternatives()
                .try(
                    Joi.boolean(),
                    Joi.string()
                        .valid('true', 'false')
                        .custom((value) => value === 'true')
                )
                .default(false)
                .messages({
                    'boolean.base': 'La valeur des toilettes visiteurs doit être true ou false',
                    'any.only': 'La valeur doit être "true" ou "false"'
                })
        }).required()
            .messages({
                'object.base': 'La composition doit être un objet valide',
                'any.required': 'Les informations de composition sont requises'
            })
    ).required()
        .messages({
            'alternatives.types': 'La composition doit être un objet valide',
            'string.jsonInvalid': 'La composition contient du JSON invalide',
            'any.required': 'Les informations de composition sont requises'
    }),

    // 🏡 Équipements Intérieurs (valeurs libres)
    equipementsInterieurs: Joi.alternatives()
        .try(
            // Array natif avec strings quelconques
            Joi.array()
                .items(Joi.string().trim().min(1))
                .default([]),
            
            // String JSON contenant un array
            Joi.string().custom((value, helpers) => {
                // String vide → array vide
                if (value === '') return [];
                
                try {
                    const parsed = JSON.parse(value);
                    
                    if (!Array.isArray(parsed)) {
                        return helpers.error('array.base');
                    }
                    
                    // Valider que ce sont des strings non vides
                    const hasInvalidItems = parsed.some(
                        item => typeof item !== 'string' || item.trim() === ''
                    );
                    
                    if (hasInvalidItems) {
                        return helpers.error('array.invalidItems');
                    }
                    
                    return parsed;
                } catch {
                    return helpers.error('string.jsonInvalid');
                }
            })
        )
        .default([])
        .messages({
            'array.base': 'Les équipements intérieurs doivent être un tableau',
            'array.invalidItems': 'Les équipements doivent être des textes non vides',
            'string.jsonInvalid': 'Format JSON invalide pour les équipements intérieurs'
        }),

    // 🌳 Équipements Extérieurs (valeurs libres)
    equipementsExterieurs: Joi.alternatives()
        .try(
            // Array natif avec strings quelconques
            Joi.array()
                .items(Joi.string().trim().min(1))
                .default([]),
            
            // String JSON contenant un array
            Joi.string().custom((value, helpers) => {
                // String vide → array vide
                if (value === '') return [];
                
                try {
                    const parsed = JSON.parse(value);
                    
                    if (!Array.isArray(parsed)) {
                        return helpers.error('array.base');
                    }
                    
                    // Valider que ce sont des strings non vides
                    const hasInvalidItems = parsed.some(
                        item => typeof item !== 'string' || item.trim() === ''
                    );
                    
                    if (hasInvalidItems) {
                        return helpers.error('array.invalidItems');
                    }
                    
                    return parsed;
                } catch {
                    return helpers.error('string.jsonInvalid');
                }
            })
        )
        .default([])
        .messages({
            'array.base': 'Les équipements extérieurs doivent être un tableau',
            'array.invalidItems': 'Les équipements doivent être des textes non vides',
            'string.jsonInvalid': 'Format JSON invalide pour les équipements extérieurs'
        }),

    // 💰 Transaction
    transaction: stringOrObject(
        Joi.object({
            transactionType: Joi.string()
                .valid('vente', 'location')
                .required()
                .messages({
                    'string.empty': 'Le type de transaction est requis',
                    'any.only': 'Le type de transaction doit être: vente ou location',
                    'any.required': 'Le type de transaction est requis'
                }),

            prix: Joi.alternatives()
                .try(
                    Joi.number().positive(),
                    Joi.string()
                        .pattern(/^\d+(\.\d+)?$/)
                        .custom((value, helpers) => {
                            const num = parseFloat(value);
                            if (num <= 0) return helpers.error('number.positive');
                            return num;
                        })
                )
                .required()
                .messages({
                    'number.base': 'Le prix doit être un nombre',
                    'number.positive': 'Le prix doit être positif',
                    'any.required': 'Le prix est requis',
                    'string.pattern.base': 'Le prix doit être un nombre valide'
                }),

            periodeLoyer: Joi.string()
                .valid('mois', 'annuel', 'MOIS', 'ANNUEL')
                .uppercase()
                .when('transactionType', {
                    is: 'location',
                    then: Joi.required(),
                    otherwise: Joi.optional().allow(null, '')
                })
                .messages({
                    'string.empty': 'La période de loyer est requise pour une location',
                    'any.only': 'La période de loyer doit être: MOIS ou ANNUEL',
                    'any.required': 'La période de loyer est requise pour une location'
                }),

            devise: Joi.string()
                .default('FCFA')
                .messages({
                    'string.base': 'La devise doit être une chaîne de caractères'
                }),

            prixNegociable: Joi.alternatives()
                .try(
                    Joi.boolean(),
                    Joi.string()
                        .valid('true', 'false')
                        .custom((value) => value === 'true')
                )
                .default(false)
                .messages({
                    'boolean.base': 'prixNegociable doit être true ou false',
                    'any.only': 'prixNegociable doit être "true" ou "false"'
                }),

            caution: Joi.alternatives()
                .try(
                    Joi.number().integer().min(0),
                    Joi.string()
                        .pattern(/^\d+$/)
                        .custom((value, helpers) => {
                            const num = parseInt(value, 10);
                            if (num < 0) return helpers.error('number.min');
                            return num;
                        }),
                    Joi.string().allow('').custom(() => 0)
                )
                .default(0)
                .messages({
                    'number.base': 'La caution doit être un nombre',
                    'number.min': 'La caution ne peut pas être négative',
                    'string.pattern.base': 'La caution doit être un nombre entier valide'
                }),

            avance: Joi.alternatives()
                .try(
                    Joi.number().integer().min(0),
                    Joi.string()
                        .pattern(/^\d+$/)
                        .custom((value, helpers) => {
                            const num = parseInt(value, 10);
                            if (num < 0) return helpers.error('number.min');
                            return num;
                        }),
                    Joi.string().allow('').custom(() => 0)
                )
                .default(0)
                .messages({
                    'number.base': 'L\'avance doit être un nombre',
                    'number.min': 'L\'avance ne peut pas être négative',
                    'string.pattern.base': 'L\'avance doit être un nombre entier valide'
                })
        }).required()
    ).required()
    .messages({
        'alternatives.types': 'Les informations de transaction doivent être valides',
        'string.jsonInvalid': 'Les données de transaction contiennent du JSON invalide',
        'any.required': 'Les informations de transaction sont requises'
    }),

    batiment: Joi.object({
        anneeConstruction: Joi.number()
            .integer()
            .min(1900)
            .max(new Date().getFullYear())
            .allow(null)
            .messages({
                'number.min': 'L\'année de construction ne peut pas être avant 1900',
                'number.max': `L'année de construction ne peut pas être après ${new Date().getFullYear()}`
            }),

        etatConstruction: Joi.string()
            .valid('neuf', 'bon', 'renove', 'a-renover', 'en-construction')
            .allow(null, '')
            .messages({
                'any.only': 'L\'état de construction n\'est pas valide'
            }),

        typeConstruction: Joi.string()
            .valid('traditionnel', 'semi-moderne', 'moderne')
            .allow(null, '')
            .messages({
                'any.only': 'Le type de construction n\'est pas valide'
            })
    }).default({}),

    // 👁️ Visibilité
    visibilite: stringOrObject(
        Joi.object({
            niveau: Joi.string()
                .valid('normal', 'exclusif')
                .default('normal')
                .messages({
                    'any.only': 'Le niveau de visibilité doit être: normal ou exclusif',
                    'string.base': 'Le niveau de visibilité doit être une chaîne de caractères'
                }),

            enVedette: Joi.alternatives()
                .try(
                    Joi.boolean(),
                    Joi.string()
                        .valid('true', 'false')
                        .custom((value) => value === 'true')
                )
                .default(false)
                .messages({
                    'boolean.base': 'enVedette doit être true ou false',
                    'any.only': 'enVedette doit être "true" ou "false"'
                }),

            promouvoir: Joi.alternatives()
                .try(
                    Joi.boolean(),
                    Joi.string()
                        .valid('true', 'false')
                        .custom((value) => value === 'true')
                )
                .default(false)
                .messages({
                    'boolean.base': 'promouvoir doit être true ou false',
                    'any.only': 'promouvoir doit être "true" ou "false"'
                })
        }).default({
            niveau: 'normal',
            enVedette: false,
            promouvoir: false
        })
    ).default({
        niveau: 'normal',
        enVedette: false,
        promouvoir: false
    })
    .messages({
        'alternatives.types': 'Les informations de visibilité doivent être valides',
        'string.jsonInvalid': 'Les données de visibilité contiennent du JSON invalide',
        'object.base': 'La visibilité doit être un objet valide'
    })

});


