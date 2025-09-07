import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@services': resolve(__dirname, 'src/services'),
      '@store': resolve(__dirname, 'src/store'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
  server: {
    port: 3000,
    host: true,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api/v1/products': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/products/, '/api/v1/products'),
      },
      '/api/v1/users': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/users/, '/api/v1/users'),
      },
      '/api/v1/orders': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/orders/, '/api/v1/orders'),
      },
      '/api/v1/auth': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/auth/, '/api/v1/auth'),
      },
      '/api/v1/analytics': {
        target: 'http://localhost:3006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/analytics/, '/api/v1/analytics'),
      },
      '/api/v1/settings': {
        target: 'http://localhost:3007',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/settings/, '/api/v1/settings'),
      },
      '/api/v1/minio': {
        target: 'http://localhost:3008',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/minio/, '/api/v1/minio'),
      },
      '/api/v1/payments': {
        target: 'http://localhost:3009',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/payments/, '/api/v1/payments'),
      },
      '/api/v1/logistics': {
        target: 'http://localhost:3010',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/logistics/, '/api/v1/logistics'),
      },
      '/api/v1/dashboard': {
        target: 'http://localhost:3011',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/dashboard/, '/api/v1/dashboard'),
      },
      '/api/v1/inventory': {
        target: 'http://localhost:3012',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/inventory/, '/api/v1/inventory'),
      },
      '/api/v1/permissions': {
        target: 'http://localhost:3013',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/permissions/, '/api/v1/permissions'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd', '@ant-design/icons'],
          charts: ['@ant-design/charts'],
          utils: ['lodash', 'dayjs', 'axios'],
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        // 只保留這項基礎配置
        javascriptEnabled: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd', '@ant-design/icons'],
  },
})