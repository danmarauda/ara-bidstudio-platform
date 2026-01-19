#!/bin/bash
# Vercel Environment Variables Setup Script
# Run this script to add all required environment variables to Vercel

echo "Setting up Vercel environment variables..."

# Convex URL (already set, but showing for reference)
echo "✓ NEXT_PUBLIC_CONVEX_URL already configured"

# WorkOS Configuration (add your actual values)
echo ""
echo "To add WorkOS variables, run:"
echo "  vercel env add WORKOS_API_KEY production"
echo "  vercel env add WORKOS_CLIENT_ID production"
echo "  vercel env add WORKOS_REDIRECT_URI production"
echo ""
echo "To add Langflow variables (optional), run:"
echo "  vercel env add LANGFLOW_API_URL production"
echo "  vercel env add LANGFLOW_API_KEY production"
echo ""
echo "To add Docling variables (optional), run:"
echo "  vercel env add DOCLING_API_URL production"
echo "  vercel env add DOCLING_API_KEY production"






