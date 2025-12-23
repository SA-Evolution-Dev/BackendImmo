import express from 'express';
import {
  register,
  login,
  refreshToken,
  // logout,
  // logoutAll,
  // getProfile,
  // updateProfile,
  // changePassword,
  // deleteAccount,
  // getAllUsers,
  // getUserById,
  // updateUser,
  // deleteUser,
  // toggleUserStatus,
  // updateUserRole,
  // getUserStats,
} from '../controllers/userController.js';
// import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
// import { decryptRequest } from '../middlewares/encryption.middleware.js';
import {
  registerSchema,
  loginSchema,
  // updateProfileSchema,
  // changePasswordSchema,
  // updateRoleSchema,
} from '../validators/userValidator.js';
import  { upload }  from '../utils/upload.js';

const router = express.Router();


router.post('/register', 
  upload.single('corporateLogo'),
  validateRequest(registerSchema), register);

router.post('/login', validateRequest(loginSchema), login);








router.post('/refresh-token', refreshToken);

// ═══════════════════════════════════════════════════
// ROUTES PROTÉGÉES (Utilisateur connecté)
// ═══════════════════════════════════════════════════

// router.post('/logout', protect, logout);
// router.post('/logout-all', protect, logoutAll);
// router.get('/profile', protect, getProfile);
// router.put('/profile', protect, validateRequest(updateProfileSchema), updateProfile);
// router.put('/change-password', protect, validateRequest(changePasswordSchema), changePassword);
// router.delete('/profile', protect, deleteAccount);

// ═══════════════════════════════════════════════════
// ROUTES ADMIN
// ═══════════════════════════════════════════════════

// router.get('/stats', protect, restrictTo('admin'), getUserStats);
// router.get('/', protect, restrictTo('admin'), getAllUsers);
// router.get('/:id', protect, restrictTo('admin'), getUserById);
// router.put('/:id', protect, restrictTo('admin'), validateRequest(updateProfileSchema), updateUser);
// router.delete('/:id', protect, restrictTo('admin'), deleteUser);
// router.patch('/:id/toggle-status', protect, restrictTo('admin'), toggleUserStatus);
// router.patch('/:id/role', protect, restrictTo('admin'), validateRequest(updateRoleSchema), updateUserRole);

export default router;
