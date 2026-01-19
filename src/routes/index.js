import express from 'express';
import userRoutes from './userRoutes.js';
import annonceRoutes from './annonceRoutes.js';

const router = express.Router();

// Routes des ressources
router.use('/users', userRoutes);
router.use('/annonces', annonceRoutes);

export default router;
