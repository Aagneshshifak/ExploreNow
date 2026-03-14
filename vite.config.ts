import { defineConfig, UserConfig } from "vite";
import path from "path";
import type { Plugin } from 'vite';

async function tryLoadPlugin(name: string): Promise<Plugin | null> {
  try {
    const mod = await import(name);
    const factory = (mod && (mod.default ?? mod)) as any;
    return typeof factory === 'function' ? factory() : factory;
  } catch {
    return null;
  }
}

export default defineConfig(async ({ command, mode }): Promise<UserConfig> => {
  const reactPlugin =
    (await tryLoadPlugin('@vitejs/plugin-react')) ||
    (await tryLoadPlugin('@vitejs/plugin-react-swc'));

  return {
    plugins: reactPlugin ? [reactPlugin] : [],
    server: {
      port: 5173,
      host: '0.0.0.0', // Allow connections from localhost, 127.0.0.1, and network
      strictPort: false,
      allowedHosts: [
        'localhost',
        '.onrender.com', // Allow all Render subdomains
        '.render.com',
      ],
      hmr: {
        overlay: false
      },
      proxy: {
        '/graphql': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy: any, _options: any) => {
            proxy.on('error', (err: any, _req: any, res: any) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq: any, req: any, _res: any) => {
              console.log('Proxying request:', req.method, req.url, '->', proxyReq.path);
            });
          },
        },
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path: string) => path, // Keep the path as-is
          configure: (proxy: any, _options: any) => {
            proxy.on('error', (err: any, _req: any, res: any) => {
              console.log('Proxy error:', err);
              if (res && !res.headersSent) {
                res.writeHead(500, {
                  'Content-Type': 'text/plain',
                });
                res.end('Proxy error: ' + err.message);
              }
            });
            proxy.on('proxyReq', (proxyReq: any, req: any, _res: any) => {
              // Log for debugging
              if (req.url?.includes('/api/auth/login')) {
                console.log('Proxying login request:', req.method, req.url);
              }
              // Let changeOrigin handle the Origin header automatically
              // Don't override it manually as that can cause issues
            });
            proxy.on('proxyRes', (proxyRes: any, req: any, _res: any) => {
              // Log response for debugging
              if (proxyRes.statusCode >= 400) {
                console.log('Proxy response error:', proxyRes.statusCode, req.method, req.url);
              }
              // Ensure CORS headers are preserved
              if (proxyRes.headers['access-control-allow-origin']) {
                // CORS headers are already set by the backend
              }
            });
          },
        },
        '/test': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true,
        }
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      // Use esbuild for faster, more memory-efficient minification
      minify: 'esbuild',
      // Increase chunk size warning limit to 1MB (1000 kB)
      chunkSizeWarningLimit: 1000,
      // Optimize for memory efficiency
      target: 'es2020',
      sourcemap: false, // Disable sourcemaps in production to save memory
      // Aggressive memory optimizations for Render's 512MB limit
      reportCompressedSize: false, // Disable compressed size reporting to save memory
      // Enable CSS code splitting for better caching
      cssCodeSplit: true,
      rollupOptions: {
        // Reduce memory usage during build - set to 1 for minimal memory usage
        maxParallelFileOps: 1,
        // Enable treeshake for smaller bundles
        treeshake: true,
        output: {
          // Manual chunking for better code splitting
          manualChunks: (id) => {
            // Vendor chunks for large third-party libraries
            if (id.includes('node_modules')) {
              if (id.includes('react') && !id.includes('react-hook-form')) {
                return 'vendor-react';
              }
              if (id.includes('@radix-ui')) {
                return 'vendor-ui';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'vendor-query';
              }
              if (id.includes('react-hook-form') || id.includes('zod')) {
                return 'vendor-form';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-animation';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('date-fns')) {
                return 'vendor-utils';
              }
              if (id.includes('lottie-web') || id.includes('chart') || id.includes('recharts')) {
                return 'vendor-charts';
              }
              if (id.includes('helmet') || id.includes('router')) {
                return 'vendor-routing';
              }
              // Other vendor libraries
              return 'vendor-misc';
            }
            
            // Component-based chunking for better separation
            if (id.includes('/components/ui/')) {
              return 'components-ui';
            }
            
            // Page-based chunking with better separation
            if (id.includes('/pages/')) {
              const fileName = id.split('/').pop() || '';
              
              if (fileName.includes('Login') || fileName.includes('Signup') || fileName.includes('Admin')) {
                return 'pages-auth';
              }
              if (fileName.includes('Book') || fileName.includes('Payment') || fileName.includes('Confirmation')) {
                return 'pages-booking';
              }
              if (fileName.includes('Dashboard')) {
                return 'pages-dashboard';
              }
              if (fileName.includes('Tools') || fileName.includes('Expense') || fileName.includes('Visa') || 
                  fileName.includes('Travel') || fileName.includes('Route') || fileName.includes('Text') || 
                  fileName.includes('Translation')) {
                return 'pages-tools';
              }
              if (fileName.includes('Tourist') || fileName.includes('Local') || fileName.includes('Explorer')) {
                return 'pages-tourist-map';
              }
              if (fileName.includes('Trip') || fileName.includes('Hotel') || fileName.includes('Transport')) {
                return 'pages-content';
              }
            }
            
            // Default chunk for other files
            return undefined;
          },
          // Optimize chunk file names for better caching
          chunkFileNames: (chunkInfo) => {
            return `assets/[name]-[hash].js`;
          },
          // Optimize asset file names
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
              return `assets/images/[name]-[hash].[ext]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(ext || '')) {
              return `assets/fonts/[name]-[hash].[ext]`;
            }
            return `assets/[name]-[hash].[ext]`;
          }
        }
      },
    },
  };
});
