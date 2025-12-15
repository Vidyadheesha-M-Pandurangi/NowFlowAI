# -------------------------------------------------------------------
# STAGE 1: BUILD THE REACT APP
# -------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for efficient caching
COPY package*.json ./

# Write the secret API key into a .env.local file using the build argument
ARG GEMINI_API_KEY
RUN echo "VITE_GEMINI_API_KEY=${GEMINI_API_KEY}" > .env.local

# Install dependencies
RUN npm install

# Copy source code and build
COPY . .
# The build output will be in /app/dist due to the default Vite config
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

# Copy the built React app from the 'builder' stage into the Nginx web root
# We assume the output folder is 'dist' based on standard Vite settings.
COPY --from=builder /app/dist /usr/share/nginx/html

# Run Nginx in the foreground, which is required by Cloud Run
CMD ["nginx", "-g", "daemon off;"]
