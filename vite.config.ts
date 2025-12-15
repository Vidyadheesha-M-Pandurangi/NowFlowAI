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
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [react()],
        
        // --- The 'define' block remains removed for security and dynamic injection ---
        
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});
