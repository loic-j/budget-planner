import { defineConfig } from 'vite';
import devServer from '@hono/vite-dev-server';

export default defineConfig({
  plugins: [
    devServer({
      entry: 'src/index.ts',
    }),
  ],
  ssr: {
    noExternal: ['hono-pino'],
  },
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
  },
});
