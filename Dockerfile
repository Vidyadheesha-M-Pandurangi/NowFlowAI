# -------------------------------------------------------------------
# STAGE 1: BUILD THE REACT APP
# -------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for efficient caching
COPY package*.json ./

# Write the secret API key into a .env.local file using the build argument
ARG GEMINI_API_KEY
# This step is harmless as the key is not defined in the vite config, 
# but we are keeping the ARG for general build system robustness.
RUN echo "VITE_GEMINI_API_KEY=${GEMINI_API_KEY}" > .env.local

# Install dependencies
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build


# -------------------------------------------------------------------
# STAGE 2: SERVE THE BUILD WITH NGINX (The final, small image)
# -------------------------------------------------------------------
FROM nginx:alpine

# Cloud Run requires the container to listen on the port defined by the
# PORT environment variable, which defaults to 8080.
EXPOSE 8080

# Remove the default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy the CORRECTED custom nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app 
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the start-up script and make it executable
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Use the script as the entrypoint. It runs the sed command and then starts Nginx.
ENTRYPOINT ["/docker-entrypoint.sh"]

# The CMD is the default Nginx command executed by the entrypoint script
CMD ["nginx", "-g", "daemon off;"]
