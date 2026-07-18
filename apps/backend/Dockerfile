# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma 2>/dev/null || true

# ---- Development ----
FROM base AS development
ENV NODE_ENV=development
COPY . .
RUN npm install
RUN npx prisma generate
EXPOSE 4000
CMD ["npm", "run", "dev"]

# ---- Build ----
FROM base AS build
ENV NODE_ENV=production
COPY . .
RUN npm install
RUN npx prisma generate
RUN npm run build

# ---- Production ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src/prisma ./src/prisma
EXPOSE 4000
CMD ["node", "dist/server.js"]
