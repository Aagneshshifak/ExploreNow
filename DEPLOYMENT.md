# Deployment Guide for Render

## ⚠️ IMPORTANT: Memory Requirements

**This application requires 1GB+ RAM to build successfully.**

The build process (Vite bundling + esbuild server compilation) needs approximately 1-1.5GB of memory due to the large number of dependencies (4300+ modules).

### Deployment Options

#### Option 1: Render Starter Plan (Recommended - $7/month)

The simplest solution is to use Render's Starter plan which provides 1GB RAM:

```yaml
# render.yaml
services:
  - type: web
    name: explorenow
    env: node
    plan: starter  # 1GB RAM - required for build
    buildCommand: npm install && npm run build
    startCommand: npm start
```

#### Option 2: Pre-built Deployment (Free Tier Workaround)

If you must use the free tier, build locally and commit the `dist/` folder:

**Step 1: Build locally with sufficient memory**
```bash
# Build on your machine (needs 1GB+ RAM locally)
npm install
npm run build
```

**Step 2: Commit the build artifacts**
```bash
# Add dist/ to git (normally ignored, but needed for free tier)
git add dist/ -f
git commit -m "Add pre-built dist for deployment"
git push
```

**Step 3: Update render.yaml for pre-built deployment**
```yaml
services:
  - type: web
    name: explorenow
    env: node
    plan: free
    buildCommand: echo "Using pre-built dist/ folder"
    startCommand: npm start
```

**Step 4: Add a postinstall script to package.json**
```json
{
  "scripts": {
    "postinstall": "if [ ! -d dist ]; then echo 'Warning: dist/ folder missing. Run npm run build locally first'; fi"
  }
}
```

## Configuration Files

### render.yaml

```yaml
services:
  - type: web
    name: explorenow
    env: node
    region: oregon
    plan: starter  # Minimum 1GB RAM required
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: NODE_OPTIONS
        value: --max-old-space-size=768 --gc-interval=100
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: GROQ_API_KEY
        sync: false
      - key: GEMINI_API_KEY
        sync: false
      - key: CURRENCY_API_KEY
        sync: false
    healthCheckPath: /api/health
```

### Environment Variables

Required environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) | ✅ |
| `JWT_SECRET` | Secret for JWT signing | ✅ |
| `GROQ_API_KEY` | Groq API for AI features | ✅ |
| `GEMINI_API_KEY` | Google Gemini API | ✅ |
| `CURRENCY_API_KEY` | Currency conversion API | ✅ |
| `STRIPE_SECRET_KEY` | Stripe payment processing | ❌ |
| `STRIPE_PUBLISHABLE_KEY` | Stripe client key | ❌ |

### Build Process

The build consists of two phases:

1. **Frontend Build (Vite)**
   - Bundles React app with 4300+ modules
   - Outputs to `dist/public/`
   - Requires ~1GB RAM

2. **Server Build (esbuild)**
   - Compiles Express server to `dist/index.js`
   - Requires ~512MB RAM

### Memory Optimizations Applied

1. **Vite Config**:
   - `minify: 'esbuild'` (faster, less memory than terser)
   - `sourcemap: false` (saves memory)
   - `reportCompressedSize: false` (saves memory)
   - `cssCodeSplit: false` (reduces memory)
   - `maxParallelFileOps: 1` (limits concurrent operations)
   - `treeshake: false` (trade-off: larger bundle, less memory)

2. **Build Server**:
   - Uses esbuild with memory limits
   - Minifies server bundle
   - Disables code splitting for server

3. **Runtime**:
   - Database pool limited to 3 connections
   - No sourcemaps in production
   - Optimized chunk loading

### Troubleshooting

**Build fails with "JavaScript heap out of memory"**:
- The free tier (512MB) is insufficient for building
- Upgrade to Starter plan (1GB) OR use pre-built deployment method

**"Could not find the build directory" error**:
- This was a path issue in `server/vite.ts` - now fixed
- The static files path now correctly points to `dist/public/`

**Runtime memory issues**:
- Monitor database connections
- Check for memory leaks in cron jobs
- The prediction update job is disabled by default for memory optimization

**Health check fails**:
- Verify `/api/health` endpoint is accessible
- Check that all required env vars are set
- Review Render logs for startup errors

### Production vs Development

**Development**:
```bash
npm run dev  # Starts Vite dev server + Express API separately
```
- Vite on port 5173
- Express on port 5000
- Hot module replacement enabled

**Production**:
```bash
npm run build  # Build frontend + server
npm start      # Start production server
```
- Single Express server on port 10000
- Serves static files from `dist/public/`
- API routes at `/api/*`

### Success Indicators

Your deployment is successful when:
- ✅ Build completes without memory errors
- ✅ Health check endpoint returns 200
- ✅ Memory usage stays below 800MB (Starter plan)
- ✅ Application loads and functions correctly
- ✅ API endpoints respond properly

### Support

If issues persist:
1. Check Render logs for specific errors
2. Test build locally: `npm run build && npm start`
3. Verify all environment variables are set
4. Consider upgrading to higher memory plan if needed
