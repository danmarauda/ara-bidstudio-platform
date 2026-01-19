# Vercel Environment Variables Setup

## Current Status

✅ **Already Configured:**
- `NEXT_PUBLIC_CONVEX_URL` - Set for Production, Preview, and Development

## Adding Environment Variables via CLI

### Required Variables

#### WorkOS Configuration
```bash
# Add WorkOS API Key
vercel env add WORKOS_API_KEY production
# Enter your WorkOS API key when prompted

# Add WorkOS Client ID
vercel env add WORKOS_CLIENT_ID production
# Enter your WorkOS Client ID when prompted

# Add WorkOS Redirect URI
vercel env add WORKOS_REDIRECT_URI production
# Enter: https://contract-analysis.vercel.app/api/auth/callback
```

#### Optional: Add to Preview and Development too
```bash
# For each variable, also add to preview and development:
vercel env add WORKOS_API_KEY preview
vercel env add WORKOS_API_KEY development

vercel env add WORKOS_CLIENT_ID preview
vercel env add WORKOS_CLIENT_ID development

vercel env add WORKOS_REDIRECT_URI preview
vercel env add WORKOS_REDIRECT_URI development
```

### Optional Variables

#### Langflow (if using)
```bash
vercel env add LANGFLOW_API_URL production
vercel env add LANGFLOW_API_KEY production
```

#### Docling (if using)
```bash
vercel env add DOCLING_API_URL production
vercel env add DOCLING_API_KEY production
```

## Quick Setup Script

You can also use this interactive approach:

```bash
# WorkOS Setup
read -p "Enter WorkOS API Key: " WORKOS_KEY
vercel env add WORKOS_API_KEY production <<< "$WORKOS_KEY"

read -p "Enter WorkOS Client ID: " WORKOS_CLIENT
vercel env add WORKOS_CLIENT_ID production <<< "$WORKOS_CLIENT"

vercel env add WORKOS_REDIRECT_URI production <<< "https://contract-analysis.vercel.app/api/auth/callback"
```

## Verify Environment Variables

```bash
# List all environment variables
vercel env ls

# Pull environment variables locally (for testing)
vercel env pull .env.local
```

## After Adding Variables

After adding new environment variables, redeploy:

```bash
vercel --prod
```

Or trigger a new deployment through the Vercel dashboard.

## Important Notes

1. **Environment Variables are Encrypted**: Vercel encrypts all environment variables
2. **Redeploy Required**: After adding new variables, you need to redeploy for them to take effect
3. **Convex Variables**: WorkOS and other backend variables should be set in Convex Dashboard, not Vercel (unless needed client-side)
4. **NEXT_PUBLIC_ Prefix**: Only variables with `NEXT_PUBLIC_` prefix are available in the browser

## Current Deployment

- **Production URL**: https://contract-analysis-dscr8t1b9-alias-labs.vercel.app
- **Project**: alias-labs/contract-analysis
- **Dashboard**: https://vercel.com/alias-labs/contract-analysis
