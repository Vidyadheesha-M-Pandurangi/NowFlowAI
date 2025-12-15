// vite.config.js (FINAL)
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env variables for local dev, but do NOT inject sensitive ones at build time
    const env = loadEnv(mode, '.', '');

    return {
        // Fix for blank screen: ensures asset paths are relative
        base: './', 
        
        server: {
            // Note: These settings only affect local development server (vite dev)
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [react()],
        
        // --- REMOVED: THE 'define' BLOCK IS GONE ---
        // The API key is now handled dynamically by the entrypoint script (Step 3).
        
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});
