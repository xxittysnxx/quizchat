# Stage 1: Build Frontend
FROM node:18-alpine as frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
# Build for production with relative path support configured in vite.config.js
RUN npm run build

# Stage 2: Setup Backend & Run
FROM python:3.11-slim

WORKDIR /app/backend

# Install system dependencies if needed (e.g. for potential sqlite extensions or gcc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy built frontend assets from Stage 1
# backend/main.py expects ../frontend/dist relative to itself
# Since WORKDIR is /app/backend, ../frontend/dist maps to /app/frontend/dist
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "main.py"]
