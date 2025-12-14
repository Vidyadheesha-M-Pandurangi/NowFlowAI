# -------------------------------------------------------------------
# STAGE 1: BUILD THE REACT APP
# This stage uses Node 20 to install dependencies and run the build.
# -------------------------------------------------------------------
# Use Node 20 Alpine for a small base image.
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the package files first to leverage Docker caching for npm install
COPY package*.json ./

# Write the secret API key into a temporary .env.local file
# NOTE: Cloud Run will provide GEMINI_API_KEY as a build argument (ARG)
ARG GEMINI_API_KEY
RUN echo "VITE_GEMINI_API_KEY=${GEMINI_API_KEY}" > .env.local

# Install dependencies
RUN npm install

# Copy all the rest of the app files
COPY . .

# Build the app for production (Vite outputs to 'dist' folder)
RUN npm run build


# -------------------------------------------------------------------
# STAGE 2: SERVE THE BUILD WITH NGINX
# This stage is the final, production-ready image.
# It only contains Nginx and the static built files.
# -------------------------------------------------------------------
# Use Nginx Alpine for a super lightweight web server
FROM nginx:alpine

# Cloud Run requires the container to listen on the $PORT environment variable,
# which defaults to 8080. We EXPOSE the standard Nginx port (80) but
# Cloud Run will automatically map its 8080 to this port 80.
EXPOSE 8080

# Remove the default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy your custom nginx configuration file into the Nginx directory
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from the 'builder' stage into the Nginx web root
# Vite's output is in '/app/dist' inside the builder.
COPY --from=builder /app/dist /usr/share/nginx/html

# Run Nginx in the foreground, which is required by Docker and Cloud Run
CMD ["nginx", "-g", "daemon off;"]
