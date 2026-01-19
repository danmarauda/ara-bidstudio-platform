#!/usr/bin/env node
// scripts/generate-test-summary.js
// Generate test summary report for GitLab CI

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPORTS_DIR = join(__dirname, '../reports');
const SUMMARY_FILE = join(REPORTS_DIR, 'test-summary.md');

function parseJUnitXML(xmlPath) {
  if (!existsSync(xmlPath)) {
    return null;
  }

  try {
    const xml = readFileSync(xmlPath, 'utf-8');
    const testsMatch = xml.match(/tests="(\d+)"/);
    const failuresMatch = xml.match(/failures="(\d+)"/);
    const errorsMatch = xml.match(/errors="(\d+)"/);
    const timeMatch = xml.match(/time="([\d.]+)"/);

    return {
      tests: testsMatch ? parseInt(testsMatch[1], 10) : 0,
      failures: failuresMatch ? parseInt(failuresMatch[1], 10) : 0,
      errors: errorsMatch ? parseInt(errorsMatch[1], 10) : 0,
      time: timeMatch ? parseFloat(timeMatch[1]) : 0,
    };
  } catch (error) {
    console.warn(`Warning: Could not parse ${xmlPath}:`, error.message);
    return null;
  }
}

function generateSummary() {
  const junitFiles = [
    { name: 'Unit Tests', path: join(REPORTS_DIR, 'junit.xml') },
    { name: 'Integration Tests', path: join(REPORTS_DIR, 'junit-integration.xml') },
    { name: 'Convex Tests', path: join(REPORTS_DIR, 'junit-convex.xml') },
    { name: 'E2E Tests', path: join(REPORTS_DIR, 'junit-e2e.xml') },
  ];

  const results = junitFiles.map(({ name, path }) => {
    const data = parseJUnitXML(path);
    return { name, ...data };
  });

  const total = results.reduce(
    (acc, r) => ({
      tests: acc.tests + (r.tests || 0),
      failures: acc.failures + (r.failures || 0),
      errors: acc.errors + (r.errors || 0),
      time: acc.time + (r.time || 0),
    }),
    { tests: 0, failures: 0, errors: 0, time: 0 }
  );

  const summary = `# Test Summary Report

Generated: ${new Date().toISOString()}

## Overall Results

| Metric | Value |
|--------|-------|
| Total Tests | ${total.tests} |
| Passed | ${total.tests - total.failures - total.errors} |
| Failed | ${total.failures} |
| Errors | ${total.errors} |
| Total Time | ${total.time.toFixed(2)}s |
| Pass Rate | ${total.tests > 0 ? (((total.tests - total.failures - total.errors) / total.tests) * 100).toFixed(2) : 0}% |

## Test Suites

${results
  .map(
    (r) => `### ${r.name}

- Tests: ${r.tests || 0}
- Failures: ${r.failures || 0}
- Errors: ${r.errors || 0}
- Time: ${r.time ? r.time.toFixed(2) + 's' : 'N/A'}
- Status: ${r.tests && r.failures === 0 && r.errors === 0 ? '✅ Pass' : '❌ Fail'}
`
  )
  .join('\n')}

## Coverage

Coverage reports are available in the \`coverage/\` directory.

- HTML Report: \`coverage/lcov-report/index.html\`
- LCOV Report: \`coverage/lcov.info\`
- Cobertura Report: \`coverage/cobertura-coverage.xml\`
`;

  // Ensure reports directory exists
  if (!existsSync(REPORTS_DIR)) {
    mkdirSync(REPORTS_DIR, { recursive: true });
  }

  writeFileSync(SUMMARY_FILE, summary);
  console.log('✅ Test summary generated:', SUMMARY_FILE);
  console.log('\n' + summary);
}

function main() {
  try {
    generateSummary();
  } catch (error) {
    console.error('❌ Error generating test summary:', error);
    process.exit(1);
  }
}

main();

