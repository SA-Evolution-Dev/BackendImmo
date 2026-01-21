/* eslint-disable prefer-const */
import userService from '../services/userService.js';
import entrepriseService from '../services/entrepriseService.js';
import tokenService from '../services/tokenService.js';
import gedService from '../services/gedService.js';
import { sendVerificationEmail } from '../services/emailService.js';
import ApiResponse from '../utils/response.js';
import asyncHandler from '../utils/asyncHandler.js';
import config from '../config/env.js';
import User from '../models/userModel.js';
import crypto from 'crypto';


/**
 * @desc    Inscription d'un nouvel utilisateur
 * @route   POST /api/v1/users/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {

  const user = await userService.createUser(req.body);
  // const tokens = tokenService.generateTokens(user.identityKey);
  // await tokenService.saveRefreshToken(user, tokens.refreshToken, req);

  // Cas enreg. nouvelle entreprise
  if (req.body.role === 'entreprise') {

    // Uploader le logo vers la GED si présent
    let uploadedFileData = null;
    if (req.file) {
      uploadedFileData = await gedService.uploadFileLogo(req.file, {
        documentType: 'corporateLogo',
        corporateName: req.body.corporateName
      });
    }

    req.body.responsableKey = user.identityKey
    let societe = await entrepriseService.createEntreprise(req.body);

    if (![null, undefined, ''].includes(uploadedFileData)) {
      const fileUloadedData = uploadedFileData?.uploaded_files[0]
      societe.logoFile = fileUloadedData
      societe.save()
    }
  }


  return ApiResponse.created(
    res,
    {
      user: user.toJSON(),
      // accessToken: tokens.accessToken,
      // refreshToken: tokens.refreshToken,
    },
    'Utilisateur créé avec succès'
  );
});


export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  
  // Rechercher l'utilisateur avec ce token
  const user = await User.findOne({
    verificationToken: token
  });

  // Vérifier si l'utilisateur existe
  if (!user) {
    return ApiResponse.error(
      res,
      'Token d\'activation invalide',
      401,
      {errorCode: 'INVALID_TOKEN', message: 'Token d\'activation invalide'}
    );
  }

  // Vérifier si le compte est déjà activé
  if (user.isActive) {
    return ApiResponse.error(
      res,
      'Ce compte est déjà activé',
      401,
      {errorCode: 'ALREADY_ACTIVATED', message: 'Ce compte est déjà activé', email: user.email}
    );
  }

  // Vérifier si le token a expiré (24h)
  const now = new Date();
  if (user.activationTokenExpires < now) {
    return ApiResponse.error(
      res,
      'Le lien d\'activation a expiré. Veuillez demander un nouveau lien.',
      410,
      {errorCode: 'TOKEN_EXPIRED', message: "Le lien d'activation a expiré. Veuillez demander un nouveau lien.", email: user.email}
    );
  }

  // Activer le compte
  user.isActive = true;
  user.emailVerified = true;
  user.activationToken = null;
  user.activationTokenExpires = null;
  await user.save();

  return ApiResponse.success(
    res,
    { email: user.email, isActive: user.isActive },
    'Votre compte a été activé avec succès !',
  );
})


export const resendActivation = asyncHandler(async (req, res) => { 
  const { email } = req.body;

  // Validation
  if (!email) {
    return ApiResponse.error(
      res,
      'L\'email est requis',
      500
    );
  }

  // Rechercher l'utilisateur
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return ApiResponse.error(
      res,
      'Aucun compte trouvé avec cet email',
      401
    );
  }

  // Vérifier si déjà activé
  if (user.isActive) {
    return ApiResponse.error(
      res,
      'Ce compte est déjà activé',
      401
    );
  }

  // Générer un nouveau token
  const newToken = crypto.randomBytes(32).toString('hex');
  user.activationToken = newToken;
  user.activationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  await user.save();

  // Envoyer l'email
  await sendVerificationEmail(user.email, user.name, newToken);

  return ApiResponse.success(
    res,
    {},
    'Un nouveau lien d\'activation a été envoyé à votre adresse email'
  );

})


/**
 * @desc    Connexion d'un utilisateur
 * @route   POST /api/v1/users/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Authentifier l'utilisateur
  const user = await userService.login(email, password, req);

  // Générer les tokens
  const tokens = tokenService.generateTokens(user.identityKey);

  // Sauvegarder le refresh token
  await tokenService.saveRefreshToken(user, tokens.refreshToken, req);

  const responseData = {
    user: user.toJSON(),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  }

  return ApiResponse.success(
    res,
    responseData,
    'Connexion réussie'
  );
});



















/**
 * @desc    Rafraîchir les tokens
 * @route   POST /api/v1/users/refresh-token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  const refreshTokenFromCookie = req.cookies?.refreshToken;
  const refreshTokenToUse = token || refreshTokenFromCookie;

  if (!refreshTokenToUse) {
    return ApiResponse.badRequest(res, 'Refresh token manquant');
  }

  const { user, accessToken, refreshToken: newRefreshToken } =
    await userService.refreshTokens(refreshTokenToUse, req);

  // Définir les nouveaux cookies
  setTokenCookies(res, {
    accessToken,
    refreshToken: newRefreshToken,
  });

  return ApiResponse.success(
    res,
    {
      user: user.toJSON(),
      accessToken,
      refreshToken: newRefreshToken,
    },
    'Tokens rafraîchis avec succès'
  );
});

/**
 * @desc    Déconnexion
 * @route   POST /api/v1/users/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  await userService.logoutUser(req.user._id, refreshToken);

  // Supprimer les cookies
  clearTokenCookies(res);

  return ApiResponse.success(res, null, 'Déconnexion réussie');
});

/**
 * @desc    Déconnexion de tous les appareils
 * @route   POST /api/v1/users/logout-all
 * @access  Private
 */
export const logoutAll = asyncHandler(async (req, res) => {
  await userService.logoutUser(req.user._id, null);

  // Supprimer les cookies
  clearTokenCookies(res);

  return ApiResponse.success(
    res,
    null,
    'Déconnexion de tous les appareils réussie'
  );
});

/**
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  return ApiResponse.success(
    res,
    { user: req.user },
    'Profil récupéré avec succès'
  );
});

/**
 * @desc    Mettre à jour le profil
 * @route   PUT /api/v1/users/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateUserProfile(req.user._id, req.body);

  return ApiResponse.success(
    res,
    { user: user.toJSON() },
    'Profil mis à jour avec succès'
  );
});

/**
 * @desc    Changer le mot de passe
 * @route   PUT /api/v1/users/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const result = await userService.changePassword(
    req.user._id,
    currentPassword,
    newPassword
  );

  // Supprimer les cookies après changement de mot de passe
  clearTokenCookies(res);

  return ApiResponse.success(res, result, result.message);
});

/**
 * @desc    Supprimer son compte
 * @route   DELETE /api/v1/users/profile
 * @access  Private
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.user._id);

  // Supprimer les cookies
  clearTokenCookies(res);

  return ApiResponse.success(res, result, result.message);
});

/**
 * @desc    Obtenir tous les utilisateurs (Admin)
 * @route   GET /api/v1/users
 * @access  Private/Admin
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers(req.query);

  return ApiResponse.success(res, result, 'Utilisateurs récupérés avec succès');
});

/**
 * @desc    Obtenir un utilisateur par ID (Admin)
 * @route   GET /api/v1/users/:id
 * @access  Private/Admin
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  return ApiResponse.success(
    res,
    { user: user.toJSON() },
    'Utilisateur récupéré avec succès'
  );
});

/**
 * @desc    Mettre à jour un utilisateur (Admin)
 * @route   PUT /api/v1/users/:id
 * @access  Private/Admin
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUserProfile(req.params.id, req.body);

  return ApiResponse.success(
    res,
    { user: user.toJSON() },
    'Utilisateur mis à jour avec succès'
  );
});

/**
 * @desc    Supprimer un utilisateur (Admin)
 * @route   DELETE /api/v1/users/:id
 * @access  Private/Admin
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.params.id);

  return ApiResponse.success(res, result, result.message);
});

/**
 * @desc    Activer/désactiver un utilisateur (Admin)
 * @route   PATCH /api/v1/users/:id/toggle-status
 * @access  Private/Admin
 */
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await userService.toggleUserStatus(req.params.id);

  return ApiResponse.success(
    res,
    { user: user.toJSON() },
    `Utilisateur ${user.isActive ? 'activé' : 'désactivé'} avec succès`
  );
});

/**
 * @desc    Mettre à jour le rôle d'un utilisateur (Admin)
 * @route   PATCH /api/v1/users/:id/role
 * @access  Private/Admin
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const user = await userService.updateUserRole(req.params.id, role);

  return ApiResponse.success(
    res,
    { user: user.toJSON() },
    'Rôle mis à jour avec succès'
  );
});

/**
 * @desc    Obtenir les statistiques des utilisateurs (Admin)
 * @route   GET /api/v1/users/stats
 * @access  Private/Admin
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStats();

  return ApiResponse.success(
    res,
    stats,
    'Statistiques récupérées avec succès'
  );
});

// ═══════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════

/**
 * Définir les cookies pour les tokens
 */
const setTokenCookies = (res, tokens) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
  };

  // Access token - expire rapidement
  res.cookie('accessToken', tokens.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Refresh token - expire après plus longtemps
  res.cookie('refreshToken', tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  });
};

/**
 * Supprimer les cookies des tokens
 */
const clearTokenCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};
