/**
 * Classe pour standardiser les réponses API
 */
class ApiResponse {
  /**
   * Réponse de succès
   */
  static success(res, data = null, message = 'Succès', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Réponse de succès avec pagination
   */
  static successWithPagination(res, data, pagination, message = 'Succès', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      pagination: {
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
        pages: pagination.pages,
        hasNextPage: pagination.page < pagination.pages,
        hasPrevPage: pagination.page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Réponse d'erreur
   */
  static error(res, message = 'Erreur', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Réponse de validation échouée
   */
  static validationError(res, errors, message = 'Erreur de validation') {
    return res.status(400).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Réponse non autorisé
   */
  static unauthorized(res, message = 'Non autorisé - Token manquant ou invalide') {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Réponse interdit
   */
  static forbidden(res, message = 'Accès interdit - Permissions insuffisantes') {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Réponse non trouvé
   */
  static notFound(res, message = 'Ressource non trouvée') {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Réponse conflit
   */
  static conflict(res, message = 'Conflit - La ressource existe déjà') {
    return res.status(409).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Réponse too many requests
   */
  static tooManyRequests(res, message = 'Trop de requêtes - Veuillez réessayer plus tard') {
    return res.status(429).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Réponse created
   */
  static created(res, data, message = 'Ressource créée avec succès') {
    return res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Réponse no content
   */
  static noContent(res) {
    return res.status(204).send();
  }
}

export default ApiResponse;
