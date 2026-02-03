/**
 * Wrapper pour gérer les erreurs async/await dans les controllers
 * @param {Function} fn - La fonction controller à wrapper
 * @returns {Function} Middleware Express
 */
const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      // 1. Log complet de l'erreur côté serveur
      console.error('Error in asyncHandler:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
      });

      // 2. Déterminer le type d'erreur
      if (err.name === 'ValidationError') {
        // Erreurs de validation (ex: Mongoose)
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: err.errors || err.message
        });
      } else if (err.name === 'UnauthorizedError') {
        // Erreurs d'authentification (ex: JWT)
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication failed'
        });
      } else if (err.statusCode) {
        // Erreurs avec un code HTTP personnalisé
        return res.status(err.statusCode).json({
          success: false,
          error: err.message || 'An error occurred'
        });
      } else {
        // Erreur générique (500)
        return res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          // On peut inclure un message générique ou un identifiant de log
          message: process.env.NODE_ENV === 'development'
            ? err.message
            : 'An unexpected error occurred. Please try again later.'
        });
      }
    }
  };
};

export default asyncHandler;

