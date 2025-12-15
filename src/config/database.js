import mongoose from 'mongoose';
import config from './env.js';
import logger from '../utils/logger.js';

/**
 * Options de connexion MongoDB optimisées pour Node.js 20.x
 */
const mongooseOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Utiliser IPv4, éviter les problèmes de résolution DNS
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 2000,
  retryWrites: true,
  retryReads: true,
  w: 'majority',
};

/**
 * Connexion à MongoDB
 */
const connectDB = async () => {
  try {
    // Configuration de Mongoose
    mongoose.set('strictQuery', false);
    
    // Debug mode en développement
    if (config.nodeEnv === 'development') {
      mongoose.set('debug', (collectionName, method, query, doc) => {
        logger.debug(`MongoDB Query: ${collectionName}.${method}`, {
          query: JSON.stringify(query),
          doc: doc ? JSON.stringify(doc) : undefined,
        });
      });
    }

    // Connexion
    const conn = await mongoose.connect(config.mongoUri, mongooseOptions);

    logger.info(`MongoDB connecté avec succès!`);
    // logger.info(`Host: ${conn.connection.host}`);
    // logger.info(`Database: ${conn.connection.name}`);
    // logger.info(`Port: ${conn.connection.port}`);
    // logger.info(`Mongoose Version: ${mongoose.version}`);

    // Configuration des événements de connexion
    setupConnectionEvents();

    return conn;
  } catch (error) {
    logger.error('Erreur de connexion MongoDB:', {
      message: error.message,
      stack: error.stack,
    });
    
    // En production, on ne quitte pas immédiatement pour permettre le retry
    if (config.nodeEnv === 'production') {
      logger.error('Tentative de reconnexion dans 5 secondes...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

/**
 * Configuration des événements MongoDB
 */
const setupConnectionEvents = () => {
  const { connection } = mongoose;

  // Événement de connexion réussie
  connection.on('connected', () => {
    logger.info('Mongoose connecté à MongoDB');
  });

  // Événement d'erreur
  connection.on('error', (err) => {
    logger.error('Erreur Mongoose:', {
      message: err.message,
      name: err.name,
    });
  });

  // Événement de déconnexion
  connection.on('disconnected', () => {
    logger.warn('Mongoose déconnecté de MongoDB');
    
    // Tentative de reconnexion automatique en production
    if (config.nodeEnv === 'production') {
      logger.info('Tentative de reconnexion dans 5 secondes...');
      setTimeout(connectDB, 5000);
    }
  });

  // Événement de reconnexion
  connection.on('reconnected', () => {
    logger.info('Mongoose reconnecté à MongoDB');
  });

  // Événement de fermeture
  connection.on('close', () => {
    logger.info('🔒 Connexion MongoDB fermée');
  });

  // Gestion des signaux de terminaison
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} reçu. Fermeture de la connexion MongoDB...`);
    
    try {
      await connection.close(false);
      logger.info('Connexion MongoDB fermée proprement');
    } catch (error) {
      logger.error('Erreur lors de la fermeture de MongoDB:', error);
    }
  };

  // Intercepter les signaux de terminaison
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
};

/**
 * Vérifier l'état de la connexion
 */
export const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Fermer la connexion manuellement
 */
export const closeConnection = async () => {
  try {
    await mongoose.connection.close(false);
    logger.info('Connexion MongoDB fermée manuellement');
  } catch (error) {
    logger.error('Erreur lors de la fermeture manuelle de MongoDB:', error);
    throw error;
  }
};

/**
 * Obtenir les statistiques de la connexion
 */
export const getConnectionStats = () => {
  const { connection } = mongoose;
  
  return {
    state: connection.readyState,
    stateName: getConnectionStateName(connection.readyState),
    host: connection.host,
    port: connection.port,
    name: connection.name,
    models: Object.keys(connection.models),
    collections: Object.keys(connection.collections),
  };
};

/**
 * Obtenir le nom de l'état de connexion
 */
const getConnectionStateName = (state) => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[state] || 'unknown';
};

export default connectDB;
