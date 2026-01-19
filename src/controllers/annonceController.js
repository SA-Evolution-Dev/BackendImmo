import ApiResponse from '../utils/response.js';
import asyncHandler from '../utils/asyncHandler.js';
import annonceService from '../services/annonceService.js';
import gedService from '../services/gedService.js';

export const addAnnonce = asyncHandler(async (req, res) => {

    console.log("req.files", req.files);
    console.log("req.body", req.body);
    

    const uploadedMedias = [];
    if (req.files && req.files.length > 0) {
        console.log(`📤 Upload de ${req.files.length} fichier(s)`);
        
        for (const file of req.files) {
            try {
                const uploadedFile = await gedService.uploadFile(file, {
                    documentType: 'annonce_media',
                    annonceRef: req.body.reference || 'temp'
                });
                
                uploadedMedias.push({
                    url: uploadedFile.url || uploadedFile.path,
                    type: file.mimetype.startsWith('video/') ? 'video' : 'image',
                    filename: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
                    gedId: uploadedFile.id // ID du fichier dans la GED
                });
                
                console.log(`✅ Fichier uploadé: ${file.originalname}`);
            } catch (error) {
                console.error(`❌ Erreur upload ${file.originalname}:`, error.message);
                throw new Error(`Échec upload du fichier ${file.originalname}`);
            }
        }
    }

    const annonceData = {
        ...req.body,
        medias: uploadedMedias
    };
    
    await annonceService.createAnnonce(annonceData);

    return ApiResponse.created(
        res,
        {},
        'Annonce créée avec succès'
    );
});



