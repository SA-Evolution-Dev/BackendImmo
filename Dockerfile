# ═══════════════════════════════════════════════════
# ÉTAPE 1: Base
# ═══════════════════════════════════════════════════
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

# ═══════════════════════════════════════════════════
# ÉTAPE 2: Development
# ═══════════════════════════════════════════════════
FROM base AS development

RUN npm ci

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]

# ═══════════════════════════════════════════════════
# ÉTAPE 3: Production
# ═══════════════════════════════════════════════════
FROM base AS production

ENV NODE_ENV=production

RUN npm ci --only=production && npm cache clean --force

COPY . .

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/server.js"]
