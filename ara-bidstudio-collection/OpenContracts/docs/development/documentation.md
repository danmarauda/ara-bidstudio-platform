## Documentation Stack

We're using mkdocs to render our markdown into pretty, bite-sized pieces. The markdown lives in `/docs` in our repo. If you want to work on the docs you'll need to install the requirements in `/requirements/docs.txt`.

To have a live server while working on them, type:

```
mkdocs serve
```

## Building Docs

To build a html website from your markdown that can be uploaded to a webhost (or a GitHub Page),
just type:

```
mkdocs build
```

## Deploying to GH Page

mkdocs makes it super easy to deploy your docs to a GitHub page.

Just run:

```
mkdocs gh-deploy
```

### Troubleshooting Deployment

If you encounter issues when deploying:

#### Git LFS Error
If you see: `This repository is configured for Git LFS but 'git-lfs' was not found on your path`

**Option 1: Install Git LFS** (if your repo uses large files)
```bash
# Ubuntu/Debian
sudo apt-get install git-lfs

# macOS
brew install git-lfs

# Initialize
git lfs install
```

**Option 2: Remove Git LFS hook** (if you don't need it)
```bash
rm .git/hooks/pre-push
```

#### Push Permission Errors
If the push fails with permission errors:

```bash
# Ensure you're authenticated
git remote -v

# Try pulling the gh-pages branch first
git checkout gh-pages
git pull origin gh-pages
git checkout main

# Then retry deployment
mkdocs gh-deploy
```

#### Branch Protection
If the `gh-pages` branch is protected, you may need to:
1. Check your GitHub repository settings
2. Ensure you have write permissions
3. Temporarily disable branch protection rules for deployment
