# Stage 1: Build the React client
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the server
FROM node:18-alpine AS server-build
WORKDIR /app/server
RUN apk add --no-cache python3 make g++
COPY server/package*.json ./
RUN npm install
COPY server/ ./

# Stage 3: Final runtime image
FROM node:18-alpine
WORKDIR /app

# Copy server dependencies and code
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/package*.json ./server/
COPY --from=server-build /app/server/src ./server/src

# Copy built client
COPY --from=client-build /app/client/dist ./server/dist

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server/src/index.js"]
