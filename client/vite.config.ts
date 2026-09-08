import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      generatedRouteTree: 'src/routeTree.gen.ts',
    }),
    react(),
    svgr({ include: '**/*.svg?react' }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.tsx'],
    css: true,
  },
});
