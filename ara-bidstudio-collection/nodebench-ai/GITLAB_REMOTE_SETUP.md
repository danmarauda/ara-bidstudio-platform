# GitLab Remote Setup Guide

## Current Status

**Current Remote:**
- `origin` → `https://github.com/HomenShum/nodebench-ai.git` (GitHub)

**GitLab Remote:** Not configured yet

## Setup Options

### Option 1: Add GitLab as Additional Remote (Recommended)

Keep GitHub as `origin`, add GitLab as `gitlab`:

```bash
# Add GitLab remote
git remote add gitlab https://gitlab.com/aliaslabs/nodebench-ai.git
# OR if using SSH:
git remote add gitlab git@gitlab.com:aliaslabs/nodebench-ai.git

# Verify
git remote -v
```

Then push to both:
```bash
# Push to GitHub
git push origin main

# Push to GitLab
git push gitlab main
```

### Option 2: Replace Origin with GitLab

If you want GitLab to be the primary remote:

```bash
# Remove current origin
git remote remove origin

# Add GitLab as origin
git remote add origin https://gitlab.com/aliaslabs/nodebench-ai.git
# OR if using SSH:
git remote add origin git@gitlab.com:aliaslabs/nodebench-ai.git

# Verify
git remote -v
```

### Option 3: Create New GitLab Repository

If the repository doesn't exist yet in GitLab:

1. **Go to GitLab**: https://gitlab.com/aliaslabs
2. **Create New Project**:
   - Click "New project" → "Create blank project"
   - Name: `nodebench-ai`
   - Visibility: Choose (Private/Internal/Public)
   - **DO NOT** initialize with README (we already have files)
3. **Copy the repository URL** from the project page
4. **Add as remote** (use Option 1 or 2 above)

## Quick Setup Script

Once you have the GitLab URL, run:

```bash
# Replace with your actual GitLab URL
GITLAB_URL="https://gitlab.com/aliaslabs/nodebench-ai.git"

# Add GitLab remote
git remote add gitlab $GITLAB_URL

# Verify
git remote -v
```

## Next Steps After Adding Remote

1. **Commit the CI files**:
   ```bash
   git add .gitlab-ci.yml .gitlab-ci-setup.md GITLAB_CI_QUICK_START.md scripts/check-coverage.js scripts/generate-test-summary.js
   git commit -m "Add GitLab CI/CD pipeline configuration"
   ```

2. **Push to GitLab**:
   ```bash
   git push gitlab main
   ```

3. **Set up CI/CD variables** in GitLab:
   - Go to: Settings → CI/CD → Variables
   - Add: `CONVEX_URL`, `OPENAI_API_KEY`

4. **Verify pipeline runs**:
   - Go to: CI/CD → Pipelines
   - Should see the pipeline running automatically

## GitLab Repository URL Format

**HTTPS:**
```
https://gitlab.com/aliaslabs/nodebench-ai.git
```

**SSH:**
```
git@gitlab.com:aliaslabs/nodebench-ai.git
```

## Troubleshooting

### "Repository not found"
- Verify the repository exists in GitLab
- Check you have access to the aliaslabs group
- Verify the URL is correct

### "Permission denied"
- For SSH: Ensure your SSH key is added to GitLab
- For HTTPS: Use a personal access token instead of password

### "Remote already exists"
```bash
# Remove existing remote
git remote remove gitlab

# Add again with correct URL
git remote add gitlab <URL>
```

