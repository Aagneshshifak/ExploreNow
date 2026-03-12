import { build } from 'esbuild';

// Memory optimization for Render's 512MB limit
const maxMemory = process.env.NODE_OPTIONS?.includes('max-old-space-size')
  ? undefined // Use existing NODE_OPTIONS
  : '--max-old-space-size=384'; // Default to 384MB if not set

if (maxMemory && !process.env.NODE_OPTIONS) {
  process.env.NODE_OPTIONS = maxMemory;
}

console.log('Building server with NODE_OPTIONS:', process.env.NODE_OPTIONS || 'default');

build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  // Memory-efficient esbuild options
  splitting: false, // Disable code splitting for server bundle
  treeShaking: true,
  minify: true, // Minify to reduce memory footprint
  metafile: false, // Disable metafile generation to save memory
}).then(() => {
  console.log('✅ Server build completed successfully');
}).catch((error) => {
  console.error('❌ Server build failed:', error);
  process.exit(1);
});
