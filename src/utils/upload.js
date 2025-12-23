import multer from 'multer';

// Configuration pour stocker en mémoire (pas sur le disque)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Filtrer les types de fichiers acceptés
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé'), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    }
});
