import { defineConfig } from 'tsup';

export default defineConfig({
   entry: ['components/index.ts'],
   format: ['esm', 'cjs'],
   tsconfig: 'tsconfig.build.json',
   dts: true,
   sourcemap: false,
   minify: true,
   clean: true,
   treeshake: true,
   external: ['react', 'react-dom'],
});
