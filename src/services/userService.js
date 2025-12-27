import User from '../models/userModel.js';
import { NotFoundError, ConflictError, AuthorizationError, AuthenticationError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { sendVerificationEmail } from '../services/emailService.js';

/**
 * Service de gestion des utilisateurs
 */
class UserService {

  /**
   * Créer un nouvel utilisateur
   */
  async createUser(userData) {
    try {
      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new ConflictError('Un utilisateur avec cet email existe déjà');
      }

      // Créer l'utilisateur
      const user = await User.create(userData);
      delete user.password;

      // Générer le token de vérification
      const verificationToken = user.generateVerificationToken()
      await user.save();

      // Envoyer l'email de vérification
      try {
        await sendVerificationEmail(user.email, user.name, verificationToken);
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      }

      logger.info(`Nouvel utilisateur créé: ${user.email}`);

      return user;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      logger.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }



   /**
   * Authentification (méthode principale)
   */
  async login(email, password) {
    try {
      // Récupérer l'utilisateur avec le mot de passe
      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+password');

      if (!user) {
        throw new AuthorizationError('Email ou mot de passe incorrect');
      }

      // Vérifier le mot de passe
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        throw new AuthorizationError('Email ou mot de passe incorrect');
      }

      // Vérifier si le compte est actif
      if (!user.isActive) {
        throw new AuthenticationError('Ce compte a été désactivé');
      }

      // Mettre à jour lastLogin
      user.lastLogin = new Date();
      await user.save();

      logger.info('Connexion réussie', {
        userId: user.identityKey,
        email: user.email,
      });

      // ✅ RETOURNER L'INSTANCE MONGOOSE
      return user;

    } catch (error) {
      logger.error('Erreur lors de l\'authentification', {
        error: error.message,
        email,
      });
      throw error;
    }
  }

















  /**
   * Récupérer tous les utilisateurs avec pagination
   */
  async getAllUsers(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;

      // Construction de la requête de filtrage
      const query = {};
      
      if (filters.role) {
        query.role = filters.role;
      }
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
        ];
      }

      // Exécution de la requête
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query),
      ]);

      return {
        users,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }

  /**
   * Récupérer un utilisateur par son ID
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-password').lean();

      if (!user) {
        throw new NotFoundError('Utilisateur non trouvé');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Récupérer un utilisateur par son email
   */
  async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email }).lean();

      if (!user) {
        throw new NotFoundError('Utilisateur non trouvé');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  }



  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(userId, updateData) {
    try {
      // Vérifier si l'utilisateur existe
      const user = await User.findById(userId);

      if (!user) {
        throw new NotFoundError('Utilisateur non trouvé');
      }

      // Si l'email est modifié, vérifier qu'il n'existe pas déjà
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({ email: updateData.email });
        
        if (existingUser) {
          throw new ConflictError('Un utilisateur avec cet email existe déjà');
        }
      }

      // Ne pas permettre la mise à jour du mot de passe via cette méthode
      delete updateData.password;

      // Mettre à jour l'utilisateur
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .select('-password')
        .lean();

      logger.info(`Utilisateur mis à jour: ${updatedUser.email}`);

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      logger.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(userId) {
    try {
      const user = await User.findByIdAndDelete(userId);

      if (!user) {
        throw new NotFoundError('Utilisateur non trouvé');
      }

      logger.info(`Utilisateur supprimé: ${user.email}`);

      return { message: 'Utilisateur supprimé avec succès' };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Activer/Désactiver un utilisateur
   */
  async toggleUserStatus(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new NotFoundError('Utilisateur non trouvé');
      }

      user.isActive = !user.isActive;
      await user.save();

      const status = user.isActive ? 'activé' : 'désactivé';
      logger.info(`Utilisateur ${status}: ${user.email}`);

      return {
        message: `Utilisateur ${status} avec succès`,
        isActive: user.isActive,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Erreur lors du changement de statut:', error);
      throw error;
    }
  }

  /**
   * Changer le mot de passe d'un utilisateur
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');

      if (!user) {
        throw new NotFoundError('Utilisateur non trouvé');
      }

      // Vérifier l'ancien mot de passe
      const isPasswordValid = await user.comparePassword(oldPassword);

      if (!isPasswordValid) {
        throw new ConflictError('Ancien mot de passe incorrect');
      }

      // Mettre à jour le mot de passe
      user.password = newPassword;
      await user.save();

      logger.info(`Mot de passe changé pour: ${user.email}`);

      return { message: 'Mot de passe changé avec succès' };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      logger.error('Erreur lors du changement de mot de passe:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des utilisateurs
   */
  async getUserStats() {
    try {
      const [total, active, inactive, byRole] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: false }),
        User.aggregate([
          {
            $group: {
              _id: '$role',
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      const roleStats = {};
      byRole.forEach((item) => {
        roleStats[item._id] = item.count;
      });

      return {
        total,
        active,
        inactive,
        byRole: roleStats,
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}

export default new UserService();
