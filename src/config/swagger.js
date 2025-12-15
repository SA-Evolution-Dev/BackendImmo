import swaggerJsdoc from 'swagger-jsdoc';
import config from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: `${config.appName} - Documentation API`,
      version: '1.0.0',
      description: `Documentation de l'API REST ${config.appName} créée avec Express et MongoDB`,
      contact: {
        name: 'Support API',
        email: 'support@myapi.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `${config.appUrl}/api/${config.apiVersion}`,
        description: `Serveur ${config.nodeEnv}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entrez votre token JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Message d\'erreur',
            },
            error: {
              type: 'string',
              example: 'Détails de l\'erreur',
            },
            stack: {
              type: 'string',
              example: 'Stack trace (seulement en développement)',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
            message: {
              type: 'string',
            },
          },
        },
        User: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            _id: {
              type: 'string',
              description: 'ID auto-généré',
            },
            name: {
              type: 'string',
              description: 'Nom complet de l\'utilisateur',
              minLength: 2,
              maxLength: 100,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email unique',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              default: 'user',
              description: 'Rôle de l\'utilisateur',
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Statut actif de l\'utilisateur',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de dernière modification',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Nombre total d\'éléments',
            },
            page: {
              type: 'integer',
              description: 'Page actuelle',
            },
            limit: {
              type: 'integer',
              description: 'Nombre d\'éléments par page',
            },
            pages: {
              type: 'integer',
              description: 'Nombre total de pages',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Token d\'authentification manquant ou invalide',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Accès interdit - Permissions insuffisantes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ValidationError: {
          description: 'Erreur de validation des données',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints d\'authentification et d\'autorisation',
      },
      {
        name: 'Users',
        description: 'Gestion des utilisateurs',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/models/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
