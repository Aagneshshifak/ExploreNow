import { build } from 'esbuild';

build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
}).catch(() => process.exit(1));
