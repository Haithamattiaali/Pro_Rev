import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import circleDependency from 'vite-plugin-circular-dependency'

export default defineConfig({
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    force: true
  },
  plugins: [
    react(),
    circleDependency({
      outputFilePath: './circular-deps.log',
      compile: true,
      format: true
    }),
    // Fix for HMR and initialization issues
    {
      name: 'singleHMR',
      handleHotUpdate({ modules }) {
        modules.map((m) => {
          m.clientImportedModules = new Set(); // for vite 5
          m.importers = new Set();
        });
        return modules;
      },
    }
  ],
  base: '/',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    assetsDir: 'assets',
    target: 'es2015',
    minify: 'esbuild', // Use esbuild instead of terser
    sourcemap: true, // Enable source maps for debugging
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep original names for debugging
          if (assetInfo.name === 'logo.png') {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        // Let Vite handle chunking automatically to avoid initialization issues
        // manualChunks: undefined
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
