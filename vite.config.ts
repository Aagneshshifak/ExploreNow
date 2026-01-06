import { defineConfig } from "vite";
import path from "path";

async function loadReactPlugin() {
  // Try the official plugin first, then the SWC variant. If neither is installed, return null.
  try {
    const mod = await import("@vitejs/plugin-react");
    const factory = (mod && (mod.default ?? mod)) as any;
    return factory();
  } catch {
    try {
      const mod = await import("@vitejs/plugin-react-swc");
      const factory = (mod && (mod.default ?? mod)) as any;
      return factory();
    } catch {
      return null;
    }
  }
}

export default defineConfig(async () => {
  const reactPlugin = await loadReactPlugin();

  return {
    plugins: [
      reactPlugin,
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer(),
            ),
          ]
        : []),
    ],
    server: {
      port: 5173,
      host: '0.0.0.0', // Allow connections from localhost, 127.0.0.1, and network
      strictPort: false,
      hmr: {
        overlay: false
      },
      proxy: {
        '/graphql': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Proxying request:', req.method, req.url, '->', proxyReq.path);
            });
          },
        },
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path, // Keep the path as-is
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, res) => {
              console.log('Proxy error:', err);
              if (res && !res.headersSent) {
                res.writeHead(500, {
                  'Content-Type': 'text/plain',
                });
                res.end('Proxy error: ' + err.message);
              }
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Log for debugging
              if (req.url?.includes('/api/auth/login')) {
                console.log('Proxying login request:', req.method, req.url);
              }
              // Let changeOrigin handle the Origin header automatically
              // Don't override it manually as that can cause issues
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
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
    },
  };
});
