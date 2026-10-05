import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // Relative assets support the custom domain, Pages subpaths, and local previews.
  base: './',
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4174, strictPort: true },
  build: {
    outDir: 'dist',
    target: 'es2022',
    rolldownOptions: {
      input: Object.fromEntries(
        ['index.html', 'weekly/index.html', 'feedback/index.html'].map((path) => [
          path,
          fileURLToPath(new URL(path, import.meta.url)),
        ]),
      ),
    },
  },
});
