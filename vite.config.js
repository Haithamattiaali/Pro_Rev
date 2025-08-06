import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import circleDependency from 'vite-plugin-circular-dependency'

export default defineConfig({
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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
        keep_fnames: true // Keep function names for better debugging
      },
      mangle: {
        keep_fnames: true // Keep function names
      }
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep original names for debugging
          if (assetInfo.name === 'logo.png') {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        // Manual chunks to prevent initialization issues
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          utils: ['xlsx', 'html2canvas', 'jspdf']
        }
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
