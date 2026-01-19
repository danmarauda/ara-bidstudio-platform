# Deployment Information

## Vercel Deployment

### Production URL
**https://contract-analysis-dscr8t1b9-alias-labs.vercel.app**

### Project Details
- **Project Name**: contract-analysis
- **Team**: alias-labs
- **Framework**: Next.js 16.0.3
- **Region**: Washington, D.C., USA (East) - iad1

### Environment Variables Configured
- ✅ `NEXT_PUBLIC_CONVEX_URL` - Set for Production, Preview, and Development environments
- Value: `https://impartial-bullfrog-2.convex.cloud`

### Build Configuration
- **Build Command**: `bun run build`
- **Install Command**: `bun install`
- **Development Command**: `bun run dev`
- **Node Version**: >=20.0.0 (auto-upgraded by Vercel)

### Deployment Status
✅ Successfully deployed to Vercel

### Next Steps

1. **Verify Deployment**
   - Visit: https://contract-analysis-dscr8t1b9-alias-labs.vercel.app
   - Check health endpoint: https://contract-analysis-dscr8t1b9-alias-labs.vercel.app/api/health

2. **Set Up Custom Domain** (Optional)
   - Go to Vercel Dashboard → Project Settings → Domains
   - Add your custom domain

3. **Monitor Deployment**
   - View logs: https://vercel.com/alias-labs/contract-analysis
   - Set up monitoring and error tracking

4. **Additional Environment Variables** (if needed)
   
   See `VERCEL_ENV_SETUP.md` for detailed instructions on adding environment variables via CLI.
   
   Quick commands:
   ```bash
   # WorkOS (if needed)
   vercel env add WORKOS_API_KEY production
   vercel env add WORKOS_CLIENT_ID production
   vercel env add WORKOS_REDIRECT_URI production
   
   # Verify all variables
   vercel env ls
   
   # After adding variables, redeploy
   vercel --prod
   ```

### Important Notes

- The Convex backend is already deployed and connected
- All environment variables are configured
- The deployment uses the latest Next.js 16 and React 19
- Security headers and optimizations are enabled

### Troubleshooting

If you encounter issues:
1. Check Vercel deployment logs: `vercel logs`
2. Verify environment variables: `vercel env ls`
3. Check Convex dashboard: https://dashboard.convex.dev/t/devmarauda/contract-analysis


