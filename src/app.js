import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import config from './config/env.js';
import routes from './routes/index.js';
import {errorMiddleware} from './middlewares/errorMiddleware.js';
import logger from './utils/logger.js';

// Créer l'application Express
const app = express();

// ═══════════════════════════════════════════════════
// MIDDLEWARES DE SÉCURITÉ
// ═══════════════════════════════════════════════════

app.use(helmet()); // Helmet - Sécurise les headers HTTP

// CORS - Gestion des origines croisées
const allowedOrigins = [
  'http://localhost:4200'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (comme les apps mobiles ou Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Autorise l'envoi de cookies/credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 heures
};

app.use(cors(corsOptions));

// Rate limiting - Limite le nombre de requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite à 100 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

app.use(mongoSanitize()); // Protection contre les injections NoSQL
app.use(xss()); // Protection contre les attaques XSS
app.use(hpp()); // Protection contre la pollution des paramètres HTTP

// ═══════════════════════════════════════════════════
// MIDDLEWARES GÉNÉRAUX
// ═══════════════════════════════════════════════════

// Compression des réponses
app.use(compression());

// Parser le body en JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parser les cookies
app.use(cookieParser());

// Logging HTTP avec Morgan (utilise logger Winston)
const morganFormat = config.nodeEnv === 'development' ? 'dev' : 'combined';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);

// ═══════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════

// Route de santé (health check)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API opérationnelle',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: config.apiVersion,
  });
});

// Routes principales
app.use(`/api/${config.apiVersion}`, routes);

// Route 404 - Non trouvée
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `« Une erreur est intervenue lors du traitement. Merci de réessayer ultérieurement. »`,
  });
});

// ═══════════════════════════════════════════════════
// GESTION DES ERREURS
// ═══════════════════════════════════════════════════

app.use(errorMiddleware);

export default app;
