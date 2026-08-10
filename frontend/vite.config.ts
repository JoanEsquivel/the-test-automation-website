/// <reference types="vitest/config" />
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // VITE_BASE is set to /the-test-automation-website/ by the GitHub Pages build.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      // shared/seed is the single source of truth for demo data (also read by FastAPI)
      '@seed': path.resolve(import.meta.dirname, '../shared/seed'),
    },
  },
  server: {
    fs: {
      // allow importing @seed from outside the frontend root
      allow: ['..'],
    },
  },
  test: {
    environment: 'jsdom',
    // globals enables Testing Library's automatic DOM cleanup between tests
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
