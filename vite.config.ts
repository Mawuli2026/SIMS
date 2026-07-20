import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, '.', 'VITE_');
  const apiUrl = process.env.VITE_API_URL ?? fileEnv.VITE_API_URL ?? 'http://localhost:5000';

  return {
    plugins: [
      react(),
      {
        name: 'inject-sims-api-url',
        transformIndexHtml: (html) => html.replace('__SIMS_API_URL__', apiUrl),
      },
    ],
    server: {
      port: 5173,
    },
  };
});
