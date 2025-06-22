# --- build stage ------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# 1️⃣  only metadata → cacheable layers
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# 2️⃣  source files
COPY . .

RUN pnpm run build

# --- runtime stage ---------------------------------------------
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
