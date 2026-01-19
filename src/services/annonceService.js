import Annonce from '../models/annonceModel.js';
import { ConflictError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class AnnonceService {

  async createAnnonce(annonceData) {
    try {
      const existingAnnonce = await Annonce.findOne({ reference: annonceData.reference });
      if (existingAnnonce) {
        throw new ConflictError('Cet annonce existe déjà');
      }

      const advert = await Annonce.create(annonceData);
      await advert.save();

      logger.info(`Nouvelle Annonce créé: ${advert.reference}`);
      return advert;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      logger.error('Erreur lors de la création de Annonce:', error);
      throw error;
    }
  }

}

export default new AnnonceService();
