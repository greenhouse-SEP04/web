# -------------------------------------------------------------
# Dockerfile for React + Vite front‑end of SEP04_greenhouse
# -------------------------------------------------------------
# This multi‑stage build compiles the Vite project and then
# serves the static bundle with a tiny Nginx image.
#
# ➡️  Build arguments
#     ‑ VITE_API_BASE_URL  – full URL of your back‑end API
#                             (e.g. http://backend:8080)
#
# Example build & run (local dev on Windows):
#     docker build -t greenhouse-frontend \
#         --build-arg VITE_API_BASE_URL=http://host.docker.internal:8080 .
#     docker run -d -p 8081:80 greenhouse-frontend
# -------------------------------------------------------------

############### 1️⃣  Build stage ################################
FROM node:20-alpine AS build

# Set working directory inside the container
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the source code
COPY . .

# Pass the API base URL at build time so Vite can embed it in import.meta.env
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build the production bundle
RUN npm run build

############### 2️⃣  Runtime stage ###############################
FROM nginx:1.27-alpine AS runtime

# Copy production build from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# (Optional) If you need SPA routing uncomment and provide your own config
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 inside the container
EXPOSE 80

# Launch Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
