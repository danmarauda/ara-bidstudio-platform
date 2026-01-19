# Production Deployment Guide

This guide covers deploying the Contract Analysis Platform to production with the latest packages and best practices.

## Prerequisites

- Node.js 20+ or Bun 1.0+
- Convex account with production project
- Vercel account (recommended) or similar hosting platform
- WorkOS account configured
- Access to external services (Langflow, Docling, etc.)

## Pre-Deployment Checklist

### 1. Environment Variables

Create environment variables in your hosting platform:

**Next.js Environment Variables:**
```env
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
NODE_ENV=production
```

**Convex Environment Variables (set in Convex Dashboard):**
- `WORKOS_API_KEY` - Your WorkOS API key
- `WORKOS_CLIENT_ID` - Your WorkOS client ID
- `LANGFLOW_API_URL` - Langflow instance URL (optional)
- `LANGFLOW_API_KEY` - Langflow API key (optional)
- `DOCLING_API_URL` - Docling service URL (optional)
- `DOCLING_API_KEY` - Docling API key (optional)

### 2. Update Dependencies

All packages have been updated to the latest stable versions:
- **Next.js**: 16.0.3
- **React**: 19.2.0
- **Convex**: 1.29.0
- **TypeScript**: 5.9.3
- **Tailwind CSS**: 4.1.17
- **WorkOS**: 7.73.0

Install dependencies:
```bash
bun install
```

### 3. Build Verification

Test the production build locally:
```bash
bun run build
bun run start
```

Verify:
- ✅ Build completes without errors
- ✅ Application starts successfully
- ✅ All routes are accessible
- ✅ Environment variables are loaded correctly

## Deployment Steps

### Step 1: Deploy Convex Backend

1. **Initialize Convex** (if not already done):
   ```bash
   bunx convex dev
   ```

2. **Deploy to Production**:
   ```bash
   bunx convex deploy --prod
   ```

3. **Verify Deployment**:
   - Check Convex dashboard for deployment status
   - Verify all functions are deployed
   - Test queries and mutations

### Step 2: Deploy Next.js Frontend

#### Option A: Vercel (Recommended)

1. **Connect Repository**:
   - Import your Git repository to Vercel
   - Vercel will auto-detect Next.js configuration

2. **Configure Environment Variables**:
   - Add all required environment variables in Vercel dashboard
   - Set `NEXT_PUBLIC_CONVEX_URL` to your production Convex URL

3. **Deploy**:
   - Vercel will automatically deploy on push to main branch
   - Or manually trigger deployment from dashboard

4. **Verify**:
   - Check deployment logs for errors
   - Test the live application
   - Verify security headers are present

#### Option B: Docker Deployment

1. **Build Docker Image**:
   ```bash
   docker build -t contract-analysis:latest .
   ```

2. **Run Container**:
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL \
     -e NODE_ENV=production \
     contract-analysis:latest
   ```

### Step 3: Configure External Services

1. **WorkOS**:
   - Configure redirect URIs in WorkOS dashboard
   - Add production callback URL: `https://your-domain.com/api/auth/callback`
   - Update environment variables

2. **Langflow** (if used):
   - Deploy Langflow pipelines
   - Configure API endpoints
   - Set up authentication

3. **Docling** (if used):
   - Deploy Docling microservice
   - Configure API endpoints
   - Set up authentication

## Production Optimizations

### Security Headers

The application includes comprehensive security headers:
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

### Performance Optimizations

- **Image Optimization**: AVIF and WebP formats enabled
- **Compression**: Gzip compression enabled
- **Standalone Output**: Optimized for containerized deployments
- **Package Imports**: Optimized imports for WorkOS

### Monitoring

Set up monitoring for:
- **Error Tracking**: Sentry, LogRocket, or similar
- **Performance**: Web Vitals monitoring
- **Uptime**: Health check endpoints
- **Analytics**: User behavior tracking (optional)

## Post-Deployment

### 1. Health Checks

Create a health check endpoint:
```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

### 2. Monitoring Setup

- Configure error tracking
- Set up performance monitoring
- Create alerts for critical errors
- Monitor Convex function performance

### 3. Backup Strategy

- **Convex**: Automatic backups enabled by default
- **Database**: Regular exports recommended
- **Files**: Backup document storage regularly

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version (requires 20+)
   - Verify all environment variables are set
   - Check for TypeScript errors: `bun run typecheck`

2. **Runtime Errors**:
   - Check browser console for client-side errors
   - Review server logs for server-side errors
   - Verify Convex connection

3. **Authentication Issues**:
   - Verify WorkOS configuration
   - Check redirect URIs match exactly
   - Verify API keys are correct

## Rollback Procedure

If issues occur:

1. **Vercel**: Use deployment history to rollback
2. **Convex**: Use Convex dashboard to revert deployments
3. **Database**: Restore from backups if needed

## Maintenance

### Regular Updates

- **Weekly**: Check for security updates
- **Monthly**: Review and update dependencies
- **Quarterly**: Major version updates

### Update Process

1. Test updates in development environment
2. Run full test suite
3. Deploy to staging
4. Verify functionality
5. Deploy to production

## Support

For issues or questions:
- Check [Next.js Documentation](https://nextjs.org/docs)
- Check [Convex Documentation](https://docs.convex.dev)
- Review project documentation in `DEVELOPMENT.md`







