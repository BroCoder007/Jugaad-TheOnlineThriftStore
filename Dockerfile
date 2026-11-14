FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
FROM node:24-bookworm-slim AS ui
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY angular.json ./
COPY frontend frontend
RUN npm run build
FROM node:24-bookworm-slim AS service
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY package.json ./
COPY services services
USER node
EXPOSE 3000
CMD ["sh", "-c", "exec node services/${SERVICE}.js"]
FROM service AS gateway
COPY --from=ui /app/dist dist
ENV SERVICE=gateway PORT=8080
EXPOSE 8080
