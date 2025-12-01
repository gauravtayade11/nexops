# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN adduser -D -u 1000 nexops && \
    chown -R nexops:nexops /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html

USER nexops

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
