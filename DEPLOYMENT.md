# Deployment Guide for Render

## Memory Optimization for 512MB Limit

This application has been optimized to run within Render's free tier 512MB memory limit.

### Key Optimizations Applied

1. **Build Process Memory Limit**
   - Set `NODE_OPTIONS='--max-old-space-size=460'` to limit Node.js heap to 460MB
   - This leaves ~50MB for system overhead

2. **Vite Build Optimizations**
   - Changed from `terser` to `esbuild` minification (faster, less memory)
   - Disabled sourcemaps in production
   - Added `maxParallelFileOps: 2` to limit concurrent file operations
   - Better code splitting with separate chunks for large libraries

3. **TypeScript Configuration**
   - Enabled `skipLibCheck` to skip type checking of declaration files
   - Added `isolatedModules` for faster compilation
   - Excluded test files from compilation

4. **NPM Configuration (.npmrc)**
   - Disabled audit and fund checks during install
   - Enabled prefer-offline to reduce network overhead
   - Disabled progress output to save memory

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Optimize for Render deployment"
   git push origin clean-master
   ```

2. **Connect to Render**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `clean-master` branch

3. **Configure Build Settings**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     NODE_OPTIONS=--max-old-space-size=460
     DATABASE_URL=<your-neon-db-url>
     JWT_SECRET=<generate-random-string>
     GROQ_API_KEY=<your-groq-key>
     GEMINI_API_KEY=<your-gemini-key>
     CURRENCY_API_KEY=<your-currency-key>
     ```

4. **Health Check**
   - Set health check path to `/api/health`
   - This ensures Render knows when your app is ready

### Monitoring Memory Usage

After deployment, monitor memory usage in Render dashboard:
- If memory usage is consistently above 450MB, consider:
  - Upgrading to a paid plan with more memory
  - Further optimizing code splitting
  - Lazy loading more components

### Troubleshooting

**Build fails with "Out of memory":**
- Check that `NODE_OPTIONS` is set correctly
- Verify `.npmrc` file is committed
- Try reducing `max-old-space-size` to 400MB

**Runtime memory issues:**
- Check for memory leaks in cron jobs
- Ensure database connections are properly closed
- Monitor the prediction update job

**403 Errors in Development:**
- These are proxy-related and won't occur in production
- In production, the built frontend is served directly by Express
- No Vite proxy is involved in production

### Production vs Development

**Development** (separate servers):
- Vite dev server on port 5173
- Express API server on port 5000
- Vite proxies API requests to Express

**Production** (single server):
- Express serves both API and static frontend files
- No proxy needed
- All requests go directly to Express on port 5000

### Additional Optimizations

If you still face memory issues, consider:

1. **Remove unused dependencies**
   ```bash
   npm prune --production
   ```

2. **Use dynamic imports for large components**
   ```typescript
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   ```

3. **Optimize images**
   - Use WebP format
   - Compress images before deployment
   - Consider using a CDN

4. **Database connection pooling**
   - Limit max connections in Drizzle config
   - Close connections after use

### Success Indicators

Your deployment is successful when:
- ✅ Build completes without memory errors
- ✅ Health check endpoint returns 200
- ✅ Memory usage stays below 450MB
- ✅ Application loads and functions correctly
- ✅ API endpoints respond properly

### Support

If issues persist:
1. Check Render logs for specific errors
2. Review the build output for warnings
3. Test the build locally: `npm run build && npm start`
4. Verify all environment variables are set correctly
