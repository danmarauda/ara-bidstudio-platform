#!/usr/bin/env node
// scripts/check-coverage.js
// Check if coverage meets threshold requirements

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COVERAGE_THRESHOLD = parseInt(process.env.COVERAGE_THRESHOLD || '70', 10);
const COVERAGE_FILE = join(__dirname, '../coverage/coverage-summary.json');

function checkCoverage() {
  try {
    const coverageData = JSON.parse(readFileSync(COVERAGE_FILE, 'utf-8'));
    
    const totals = coverageData.total;
    const metrics = {
      lines: totals.lines.pct,
      statements: totals.statements.pct,
      functions: totals.functions.pct,
      branches: totals.branches.pct,
    };

    console.log('\n📊 Coverage Report');
    console.log('==================');
    console.log(`Lines:       ${metrics.lines.toFixed(2)}% (threshold: ${COVERAGE_THRESHOLD}%)`);
    console.log(`Statements: ${metrics.statements.toFixed(2)}% (threshold: ${COVERAGE_THRESHOLD}%)`);
    console.log(`Functions:   ${metrics.functions.toFixed(2)}% (threshold: ${COVERAGE_THRESHOLD}%)`);
    console.log(`Branches:   ${metrics.branches.toFixed(2)}% (threshold: ${COVERAGE_THRESHOLD}%)`);
    console.log('');

    const failed = Object.entries(metrics).filter(([_, value]) => value < COVERAGE_THRESHOLD);

    if (failed.length > 0) {
      console.error('❌ Coverage threshold not met:');
      failed.forEach(([metric, value]) => {
        console.error(`   ${metric}: ${value.toFixed(2)}% < ${COVERAGE_THRESHOLD}%`);
      });
      process.exit(1);
    }

    console.log('✅ All coverage thresholds met!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ Coverage file not found. Run tests with coverage first.');
      process.exit(1);
    }
    console.error('❌ Error checking coverage:', error.message);
    process.exit(1);
  }
}

checkCoverage();

