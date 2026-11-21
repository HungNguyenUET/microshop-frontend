import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Gateway (BFF) phuc vu ca UI lan /api tren cung origin -> cookie SESSION + XSRF-TOKEN tu gui kem.
// Dev: Vite proxy cac duong dan backend sang gateway :8080 de giu nguyen mo hinh same-origin.
const GATEWAY = process.env.GATEWAY_URL ?? 'http://localhost:8080';
const proxied = ['/api', '/oauth2', '/login', '/logout', '/actuator'];

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: Object.fromEntries(
      // changeOrigin: gateway thay Host = localhost:8080 -> redirect_uri OAuth2 khop voi client da dang ky o auth-service
      proxied.map((path) => [path, { target: GATEWAY, changeOrigin: true }]),
    ),
  },
  build: {
    // Bundle duoc gateway phuc vu nhu static resource (SecurityConfig permitAll: /, /index.html, /assets/**, /favicon.svg)
    outDir: '../microshop/api-gateway/src/main/resources/static',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
});
