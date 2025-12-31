import axios from 'axios';
import FormData from 'form-data';
import config from '../config/env.js';

class GedService {
    constructor() {
        this.GED_API_URL = config.gedApiUrl || 'http://localhost:8000';
        this.GED_API_KEY = config.gedApiKey; // Pour sécuriser les appels
    }

    /**
     * Upload un fichier vers la GED Symfony
     */
    async uploadFile(file, metadata = {}) {
        try {
            // Ajouter le fichier
            const formData = new FormData();
            formData.append('file', file.buffer, {
                filename: file.originalname,
                contentType: file.mimetype
            });

            // Ajouter les métadonnées
            if (metadata.corporateName) formData.append('corporateName', metadata.corporateName);
            if (metadata.documentType) formData.append('documentType', metadata.documentType);

            const response = await axios.post(
                `${this.GED_API_URL}/api/upload-logo`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${this.GED_API_KEY}`,
                    },
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                }
            );

            console.log("response.data ++", response.data);

            return response.data;
        } catch (error) {
            console.error('[GED SERVICE] Erreur upload:', error.message);
            throw new Error('Échec de l\'upload vers la GED');
        }
    }

    /**
     * Supprimer un fichier de la GED
     */
    async deleteFile(fileId) {
        try {
            await axios.delete(`${this.GED_API_URL}/api/files/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${this.GED_API_KEY}`,
                }
            });
        } catch (error) {
            console.error('[GED SERVICE] Erreur suppression:', error.message);
        }
    }
}

export default new GedService();
