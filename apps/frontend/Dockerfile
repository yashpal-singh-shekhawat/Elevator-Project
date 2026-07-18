# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- Development ----
FROM base AS development
ENV NODE_ENV=development
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- Build ----
FROM base AS build
ENV NODE_ENV=production
COPY . .
RUN npm install
RUN npm run build

# ---- Production ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
