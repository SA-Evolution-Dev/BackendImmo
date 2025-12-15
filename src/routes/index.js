import express from 'express';
import userRoutes from './userRoutes.js';

const router = express.Router();

// Routes des ressources
router.use('/users', userRoutes);

export default router;
