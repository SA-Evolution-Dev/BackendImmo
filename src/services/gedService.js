import axios from 'axios';
import FormData from 'form-data';
import config from '../config/env.js';

class GedService {
    constructor() {
        this.GED_API_URL = config.gedApiUrl || 'http://localhost:8000';
        this.GED_API_KEY = config.gedApiKey; // Pour sécuriser les appels
    }

    async uploadFileLogo(file, metadata = {}) {
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

            return response.data;
        } catch (error) {
            console.error('[GED SERVICE] Erreur upload:', error.message);
            throw new Error('Échec de l\'upload vers la GED');
        }
    }

    async uploadMultipleFiles(files, metadata = {}) {
        try {
            const formData = new FormData();

            if (metadata.user_id) {
                formData.append('user_id', metadata.user_id);
            } else {
                throw new Error('L\'ID utilisateur est requis');
            }

            // Ajouter chaque fichier avec le même nom de champ "files[]"
            files.forEach((file) => {
                formData.append('files[]', file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype
                });
            });

            // Ajouter d'autres métadonnées si nécessaire
            Object.entries(metadata).forEach(([key, value]) => {
                if (key !== 'user_id' && key !== 'files') {
                    formData.append(key, value);
                }
            });

            const response = await axios.post(
                `${this.GED_API_URL}/api/upload`, // Utilise l'endpoint existant
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${this.GED_API_KEY}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                }
            );

            // Vérifier si l'upload a partiellement réussi
            if (!response.data.success && response.data.errors) {
                console.warn('Certains fichiers n\'ont pas pu être uploadés:', response.data.errors);
                return {
                    success: false,
                    message: response.data.message,
                    uploadedFiles: response.data.uploaded_files || [],
                    errors: response.data.errors || []
                };
            }
            
            return {
                success: true,
                data: response.data
            };

        } catch (error) {
            console.error('[GED SERVICE] Erreur upload multiple:', error.message);

            if (error.response) {
                const errorData = error.response.data;
                let errorMessage = 'Échec de l\'upload vers la GED';

                if (errorData.error_code === 'MISSING_USER_ID') {
                    errorMessage = 'L\'ID utilisateur est requis';
                } else if (errorData.error_code === 'NO_FILES') {
                    errorMessage = 'Aucun fichier valide trouvé';
                } else if (errorData.errors) {
                    errorMessage = `${errorData.message} (${errorData.statistics.total_errors} erreur(s))`;
                }

                throw new Error(errorMessage, {
                    cause: {
                        code: error.response.status,
                        details: errorData
                    }
                });
            }

            throw new Error('Échec de l\'upload multiple vers la GED: ' + error.message);
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
