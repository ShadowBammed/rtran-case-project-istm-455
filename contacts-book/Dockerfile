FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/
COPY certs/ ./certs/

ENV NODE_ENV=production
ENV PORT=3443

# Run as non-root user (fixes DS-0002: avoid container escape via root)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3443

# Health check so orchestrators know when the container is ready (fixes DS-0026)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- --no-check-certificate https://localhost:3443/health || exit 1

CMD ["node", "src/server.js"]
