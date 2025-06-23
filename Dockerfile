# --- build stage ------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# --- runtime stage ---------------------------------------------
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# Copy your custom config _before_ copying in the built files
COPY nginx.conf   /etc/nginx/conf.d/default.conf

# Then copy in the build output
COPY --from=build /app/dist .

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
