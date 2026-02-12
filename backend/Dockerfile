# Use Debian-based Node image to avoid musl/glibc native module issues
FROM node:20-slim

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY migrations ./migrations

# Create data and logs directories
RUN mkdir -p /app/data /app/logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Run migrations, seed if empty, then start the application
CMD ["sh", "-c", "node migrations/run.js && node migrations/seed_if_empty.js && node src/index.js"]
