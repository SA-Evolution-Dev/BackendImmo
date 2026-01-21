import ApiResponse from '../utils/response.js';
import asyncHandler from '../utils/asyncHandler.js';
import annonceService from '../services/annonceService.js';
import gedService from '../services/gedService.js';

export const addAnnonce = asyncHandler(async (req, res) => {

    console.log("req.files", req.files);
    console.log("req.body", req.body);

    const uploadedMedias = [];

    // Gestion des fichiers (si présents)
    if (req.files && req.files.length > 0) {
        try {
            const uploadResult = await gedService.uploadMultipleFiles(req.files, {
                user_id: req.user.id,
                documentType: 'annonce_media'
            });

            console.log("uploadResult", uploadResult);

            if (uploadResult.success) {
                uploadedMedias.push(...uploadResult.data.uploaded_files);
            } else {
                console.warn('Certains fichiers n\'ont pas pu être uploadés:', uploadResult.errors);
                // Vous pourriez quand même continuer avec les fichiers qui ont réussi
                if (uploadResult.uploadedFiles.length > 0) {
                    uploadedMedias.push(...uploadResult.uploadedFiles);
                }
            }
        } catch (error) {
            console.error('Erreur lors de l\'upload des médias:', error.message);
        }
    }

    req.body.composition.nombrePieces = (
        req.body.composition.nombreChambres + 
        req.body.composition.nombreSalons
    );

    const annonceData = {
        ...req.body,
        reference: generateReference(),
        medias: uploadedMedias
    };
    
    await annonceService.createAnnonce(annonceData);

    return ApiResponse.created(
        res,
        {},
        'Annonce créée avec succès'
    );
});



/**
 * Génère une référence unique configurable
 * @param {Object} options - Options de génération
 * @param {string} [options.prefix='REF'] - Préfixe de la référence
 * @param {number} [options.length=10] - Longueur de la partie aléatoire
 * @param {boolean} [options.useTimestamp=true] - Inclure un timestamp
 * @param {boolean} [options.useRandom=true] - Inclure une partie aléatoire
 * @param {string} [options.separator='-'] - Séparateur entre les parties
 * @param {boolean} [options.uppercase=true] - Convertir en majuscules
 * @returns {string} La référence générée
 */
function generateReference({
    prefix = 'REF',
    length = 10,
    useTimestamp = true,
    useRandom = true,
    separator = '-',
    uppercase = true
} = {}) {
    const referenceParts = [];

    // Ajouter le préfixe
    if (prefix) {
        referenceParts.push(uppercase ? prefix.toUpperCase() : prefix);
    }

    // Ajouter le timestamp si demandé
    if (useTimestamp) {
        const now = new Date();
        const timestamp = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0'),
            String(now.getHours()).padStart(2, '0'),
            String(now.getMinutes()).padStart(2, '0'),
            String(now.getSeconds()).padStart(2, '0')
        ].join('');

        referenceParts.push(timestamp);
    }

    // Ajouter la partie aléatoire si demandée
    if (useRandom) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclut les caractères ambigus
        let randomPart = '';

        for (let i = 0; i < length; i++) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        referenceParts.push(randomPart);
    }

    // Construire la référence finale
    const reference = referenceParts.join(separator);

    // Appliquer la casse
    return uppercase ? reference.toUpperCase() : reference;
}



