import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/env.js';
import logger from '../utils/logger.js';

class TokenService {
    /**
     * Générer un access token JWT
     */
    generateAccessToken(userId, additionalPayload = {}) {
        try {
            const payload = {
                id: userId,
                type: 'access',
                ...additionalPayload
            };

            const token = jwt.sign(payload, config.jwtSecret, {
                expiresIn: config.jwtAccessExpire,
                issuer: 'immobilier-api',
                audience: 'immobilier-client'
            });

            logger.debug('Access token généré', { userId });
            return token;

        } catch (error) {
            logger.error('Erreur génération access token', {
                userId,
                error: error.message
            });
            throw new Error('Erreur lors de la génération du token d\'accès');
        }
    }

    /**
     * Générer un refresh token JWT
     */
    generateRefreshToken(userId) {
        try {
            const payload = {
                id: userId,
                type: 'refresh',
                jti: crypto.randomBytes(16).toString('hex') // ID unique du token
            };

            const token = jwt.sign(payload, config.jwtRefreshSecret, {
                expiresIn: config.jwtRefreshExpire,
                issuer: 'immobilier-api',
                audience: 'immobilier-client'
            });

            logger.debug('Refresh token généré', { userId });
            return token;

        } catch (error) {
            logger.error('Erreur génération refresh token', {
                userId,
                error: error.message
            });
            throw new Error('Erreur lors de la génération du refresh token');
        }
    }

    /**
     * 🎯 GÉNÉRER LES DEUX TOKENS
     */
    generateTokens(userId, additionalPayload = {}) {
        const accessToken = this.generateAccessToken(userId, additionalPayload);
        const refreshToken = this.generateRefreshToken(userId);

        return {
            accessToken,
            refreshToken
        };
    }

    /**
     * 🎯 SAUVEGARDER LE REFRESH TOKEN EN BASE DE DONNÉES
     * @param {object} user - Document User MongoDB
     * @param {string} refreshToken - Le refresh token JWT
     * @param {object} req - Objet Request Express
     */
    async saveRefreshToken(user, refreshToken, req = null) {
        try {
            // Décoder le token pour obtenir l'expiration
            const decoded = jwt.decode(refreshToken);
            const expiresAt = new Date(decoded.exp * 1000);

            // Extraire les infos de la requête
            const device = this.extractDeviceInfo(req);
            const ip = this.extractIpAddress(req);

            // Ajouter le token au document utilisateur
            await user.addRefreshToken(refreshToken, expiresAt, device, ip);

            logger.info('Refresh token sauvegardé', {
                userId: user.identityKey,
                device,
                ip,
                expiresAt
            });

            return true;

        } catch (error) {
            logger.error('Erreur sauvegarde refresh token', {
                userId: user.identityKey,
                error: error.message
            });
            throw new Error('Erreur lors de la sauvegarde du refresh token');
        }
    }

    /**
     * 🎯 EXTRAIRE LES INFORMATIONS DE L'APPAREIL
     */
    extractDeviceInfo(req) {
        if (!req || !req.headers) {
            return 'Unknown Device';
        }

        const userAgent = req.headers['user-agent'] || '';

        // Détecter le navigateur
        let browser = 'Unknown Browser';
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        else if (userAgent.includes('Opera')) browser = 'Opera';

        // Détecter le système d'exploitation
        let os = 'Unknown OS';
        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac')) os = 'macOS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('iOS')) os = 'iOS';

        // Détecter le type d'appareil
        let deviceType = 'Desktop';
        if (userAgent.includes('Mobile')) deviceType = 'Mobile';
        else if (userAgent.includes('Tablet')) deviceType = 'Tablet';

        return `${browser} on ${os} (${deviceType})`;
    }

    /**
     * 🎯 EXTRAIRE L'ADRESSE IP
     */
    extractIpAddress(req) {
        if (!req) return null;

        return (
            req.headers['x-forwarded-for']?.split(',')[0] ||
            req.headers['x-real-ip'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.ip ||
            null
        );
    }

    /**
     * Vérifier un access token
     */
    verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, config.jwtSecret, {
                issuer: 'immobilier-api',
                audience: 'immobilier-client'
            });

            if (decoded.type !== 'access') {
                throw new Error('Type de token invalide');
            }

            return decoded;

        } catch (error) {
            logger.error('Erreur vérification access token', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Vérifier un refresh token
     */
    verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, config.jwtRefreshSecret, {
                issuer: 'immobilier-api',
                audience: 'immobilier-client'
            });

            if (decoded.type !== 'refresh') {
                throw new Error('Type de token invalide');
            }

            return decoded;

        } catch (error) {
            logger.error('Erreur vérification refresh token', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Définir les tokens dans les cookies
     */
    setTokenCookies(res, tokens) {
        // Access token (cookie HTTPOnly)
        res.cookie('accessToken', tokens.accessToken, {
            ...config.cookieOptions,
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        // Refresh token (cookie HTTPOnly)
        res.cookie('refreshToken', tokens.refreshToken, {
            ...config.cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
        });

        logger.debug('Cookies de tokens définis');
    }

    /**
     * Supprimer les cookies de tokens
     */
    clearTokenCookies(res) {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        logger.debug('Cookies de tokens supprimés');
    }

    /**
     * Générer un token de reset password
     */
    generateResetToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Hasher un token de reset
     */
    hashResetToken(token) {
        return crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
    }
}


export default new TokenService();