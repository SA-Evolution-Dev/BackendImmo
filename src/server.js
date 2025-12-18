import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/database.js';
import logger from './utils/logger.js';
import { handleUncaughtErrors } from './middlewares/errorMiddleware.js';

// Gérer les erreurs non capturées
handleUncaughtErrors();

const PORT = process.env.PORT || 3000;

// Connexion à la base de données
connectDB();

// Démarrer le serveur
const server = app.listen(PORT, () => {
  // logger.info(`Serveur démarré sur le port ${PORT}`);
  logger.info(`URL: http://localhost:${PORT}`);
  logger.info(`Mode: ${process.env.NODE_ENV}`);
  // logger.info(`📚 Documentation: http://localhost:${PORT}/api/v1/docs`);
});

// Gestion de l'arrêt propre
const gracefulShutdown = () => {
  logger.info('Arrêt du serveur en cours...');
  
  server.close(() => {
    logger.info('Serveur arrêté proprement');
    process.exit(0);
  });

  // Forcer l'arrêt après 10 secondes
  setTimeout(() => {
    logger.error('Arrêt forcé du serveur');
    process.exit(1);
  }, 10000);
};

// Écouter les signaux d'arrêt
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Export pour les tests
export default server;
