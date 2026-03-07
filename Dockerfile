FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
# Fix for esbuild ETXTBSY error in Docker builds
RUN npm ci || (sleep 2 && npm ci)

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
# Fix for esbuild ETXTBSY error in Docker builds
RUN npm ci --omit=dev || (sleep 2 && npm ci --omit=dev) && npm cache clean --force

COPY --from=build /app/dist ./dist

RUN mkdir -p /app/auth_info_baileys /app/config_baileys

EXPOSE 3000
CMD ["npm", "start"]
