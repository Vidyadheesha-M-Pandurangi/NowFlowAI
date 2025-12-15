#!/bin/sh
set -e

# Define the location of the deployed index.html
INDEX_FILE="/usr/share/nginx/html/index.html"

# Substitute the secret environment variable into the index.html file.
# We replace the placeholder with the actual value of $GEMINI_API_KEY from the Cloud Run environment.
sed -i "s|YOUR_RUNTIME_GEMINI_KEY_PLACEHOLDER|$GEMINI_API_KEY|g" $INDEX_FILE

# Execute the main Nginx command (runs Nginx in the foreground)
exec nginx -g 'daemon off;'
