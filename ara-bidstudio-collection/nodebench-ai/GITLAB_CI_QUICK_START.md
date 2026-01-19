# GitLab CI Quick Start Guide

## 🚀 Quick Setup

### 1. Environment Variables

Go to **GitLab Project → Settings → CI/CD → Variables** and add:

```
CONVEX_URL=https://your-deployment.convex.cloud
OPENAI_API_KEY=sk-...
```

Optional:
```
CONVEX_DEPLOYMENT_URL=https://your-deployment.convex.cloud
COVERAGE_THRESHOLD=70
```

### 2. Push to GitLab

The pipeline will automatically run on:
- Every push to `main` or `develop`
- Every merge request
- Manual trigger

### 3. View Results

- **Pipelines**: CI/CD → Pipelines
- **Test Results**: Pipeline → Tests tab
- **Coverage**: Pipeline → Coverage section
- **Artifacts**: Pipeline → Job → Artifacts

## 📊 Pipeline Stages

```
validate → test → coverage → report
```

### Validate
- ✅ TypeScript type checking
- ✅ ESLint code quality
- ✅ Convex validation

### Test
- ✅ Unit tests (with coverage)
- ✅ Integration tests (with coverage)
- ✅ Convex backend tests (MRs only)
- ✅ E2E tests (MRs only, allowed to fail)

### Coverage
- ✅ Coverage collection
- ✅ Threshold checking (default: 70%)

### Report
- ✅ Test summary generation

## 🧪 Running Tests Locally

```bash
# All tests with coverage
npm run test:all:ci

# Specific suites
npm run test:unit:ci
npm run test:integration:ci
npm run test:convex:ci
npm run test:e2e:ci

# Coverage check
npm run coverage:check

# Test summary
npm run report:test-summary
```

## 🔧 Troubleshooting

### Pipeline Failing

1. Check job logs for errors
2. Verify environment variables are set
3. Run tests locally: `npm run test:all:ci`

### Coverage Not Showing

1. Ensure `coverage:collect` job succeeded
2. Check `coverage/cobertura-coverage.xml` exists
3. Verify GitLab coverage visualization is enabled

### Tests Timing Out

- E2E tests have 20-minute timeout
- Unit/integration tests should complete in < 10 minutes
- Check for hanging tests or slow API calls

## 📈 Coverage Goals

- **Current Threshold**: 70%
- **Target**: 80%+ for new code
- **Critical Paths**: 90%+

## 🔗 Related Documentation

- Full setup: `.gitlab-ci-setup.md`
- CI config: `.gitlab-ci.yml`
- Test config: `vitest.config.ts`

