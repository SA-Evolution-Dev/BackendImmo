import CryptoJS from 'crypto-js';
import config from '../config/env.js';
const IS_PRODUCTION = config.nodeEnv === 'production';

// Middleware pour décrypter les données entrantes
const decryptRequest = (req, res, next) => {
  try {
    // En développement, passer directement
    if (!IS_PRODUCTION) {
      console.log('🔓 [DEV] Décryptage désactivé');
      return next();
    }    

    if (req.body && req.body.encryptedData) {
      const decrypted = CryptoJS.AES.decrypt(
        req.body.encryptedData,
        config.encryptKey
      ).toString(CryptoJS.enc.Utf8);
      
      req.body = JSON.parse(decrypted);
    }
    next();
  } catch (error) {
    console.error('Erreur de décryptage:', error);
    return res.status(400).json({
      success: false, 
      message: 'Données invalides ou corrompues' 
    });
  }
};

// Fonction pour crypter les réponses
const encryptResponse = (data) => {
  try {
    // En développement, retourner les données en clair
    if (!IS_PRODUCTION) {
      return data;
    }

    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      config.encryptKey
    ).toString();
    
    return { encryptedData: encrypted };
  } catch (error) {
    console.error('Erreur de cryptage:', error);
    throw error;
  }
};

export { decryptRequest, encryptResponse };