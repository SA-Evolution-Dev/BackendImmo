import Entreprise from '../models/entrepriseModel.js';
import { ConflictError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Service de gestion des utilisateurs
 */
class EntrepriseService {

    /**
     * Créer un nouvel utilisateur
     */
    async createEntreprise(entrepriseData) {
        try {            
            // Vérifier si l'email existe déjà
            const existingSoc = await Entreprise.findOne({ corporateName: entrepriseData.corporateName });
            if (existingSoc) {
                throw new ConflictError('Une entreprise existe déjà avec ce nom');
            }

            // Créer
            const soc = await Entreprise.create(entrepriseData);
            logger.info(`Nouvel utilisateur créé: ${soc.corporateName}`);

            return soc;
        } catch (error) {
            if (error instanceof ConflictError) {
                throw error;
            }
            logger.error('Erreur lors de la création de l\'entrprise:', error);
            throw error;
        }
    }

}

export default new EntrepriseService();
