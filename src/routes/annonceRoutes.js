import express from 'express';
import {
addAnnonce,
} from '../controllers/annonceController.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  adCreateSchema
} from '../validators/annonceValidator.js';
import  { upload }  from '../utils/upload.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/add-annonce',
  upload.array('medias', 20), // ✅ Accepte jusqu'à 20 fichiers
  validateRequest(adCreateSchema), protect, addAnnonce);

export default router;