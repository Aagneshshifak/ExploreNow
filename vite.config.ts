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
      // Reduce memory usage during build
      chunkSizeWarningLimit: 2000,
      // Optimize for memory efficiency
      target: 'es2020',
      sourcemap: false, // Disable sourcemaps in production to save memory
      rollupOptions: {
        // Reduce memory usage during build
        maxParallelFileOps: 1, // Reduced from 2 to 1 for lower memory usage
        output: {
          // Better manual chunking to separate vendor libs and large icon/UX libs
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              // Split large libraries into separate chunks
              if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('recharts')) return 'vendor-charts';
              if (id.includes('leaflet')) return 'vendor-maps';
              if (id.includes('@radix-ui')) return 'vendor-radix';
              if (id.includes('framer-motion')) return 'vendor-motion';
              if (id.includes('react-router')) return 'vendor-router';
              if (id.includes('@tanstack')) return 'vendor-query';
              return 'vendor';
            }
          }
        }
      },
    },
  };
});
