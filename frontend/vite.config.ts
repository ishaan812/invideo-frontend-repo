/// <reference types="vitest" />
import path from "path";
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // General Vite server options (if Vitest uses this server instance)
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
    // THIS is for Vite's dev server, not Vitest's specific server config for vite-node
    // deps: {
    //     inline: [/rust-calc/], 
    // }
  },
  optimizeDeps: {
    exclude: ['rust-calc'],
    // Note: `include` here is for Vite's general dependency optimizer, 
    // `test.deps.optimizer.web.include` is Vitest specific for browser-like env.
  },
  // Vitest specific config
  test: {
    // environment: 'node', // Can be set here globally or per-file
    // No longer need specific server or deps.optimizer for rust-calc here
  },
})
