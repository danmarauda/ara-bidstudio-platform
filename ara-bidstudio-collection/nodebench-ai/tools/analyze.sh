#!/usr/bin/env bash
set -euo pipefail

# Usage: ./tools/analyze.sh [path-to-repo-root] 
ROOT="${1:-.}"
cd "$ROOT"

echo "== Install tooling =="
if command -v pnpm >/dev/null 2>&1; then PM=pnpm; elif command -v npm >/dev/null 2>&1; then PM=npm; else echo "Install pnpm or npm"; exit 1; fi
$PM install

echo "== TypeScript file analysis =="
find . -path "*/node_modules" -prune -o -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l > /tmp/ts_count.txt
echo "Found $(cat /tmp/ts_count.txt) TypeScript files"

echo "== Convex function analysis =="
find convex -name "*.ts" | xargs grep -l "export.*query\|export.*mutation\|export.*action" | wc -l > /tmp/convex_functions.txt
echo "Found $(cat /tmp/convex_functions.txt) Convex functions"

echo "== React component analysis =="
find src/components -name "*.tsx" | wc -l > /tmp/react_components.txt
echo "Found $(cat /tmp/react_components.txt) React components"

echo "== Schema complexity analysis =="
if [ -f convex/schema.ts ]; then
    grep -c "v\." convex/schema.ts > /tmp/schema_fields.txt
    echo "Schema has $(cat /tmp/schema_fields.txt) field definitions"
fi

echo "== Security scan patterns =="
find . -path "*node_modules*" -prune -o -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs grep -c "console.log\|console.error" | grep -v ":0" | head -10 > /tmp/console_usage.txt
find . -path "*node_modules*" -prune -o -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs grep -l "TODO\|FIXME\|XXX\|HACK" | head -5 > /tmp/tech_debt.txt

echo "== Import dependency mapping =="
grep -r "import.*convex" src --include="*.ts" --include="*.tsx" | head -20 > /tmp/convex_imports.txt

echo "== AI system analysis =="
find agents -name "*.ts" | wc -l > /tmp/agent_files.txt
find convex/agents -name "*.ts" | wc -l > /tmp/convex_agent_files.txt
echo "Agent system: $(cat /tmp/agent_files.txt) agent files, $(cat /tmp/convex_agent_files.txt) Convex agent files"

echo "== Performance indicators =="
find src -name "*.tsx" -exec wc -l {} \; | sort -n | tail -10 > /tmp/largest_components.txt
find convex -name "*.ts" -exec wc -l {} \; | sort -n | tail -10 > /tmp/largest_functions.txt

echo "== Migration surface analysis =="
find convex -name "*.ts" | xargs grep -l "export.*query\|export.*migration\|export.*action" | wc -l > /tmp/migration_surface.txt
echo "Migration surface: $(cat /tmp/migration_surface.txt) Convex functions need tRPC conversion"

echo "== Summary Report =="
echo "Analysis complete. Generated files:"
echo "- /tmp/ts_count.txt: Total TypeScript files"
echo "- /tmp/convex_functions.txt: Convex functions count"  
echo "- /tmp/react_components.txt: React components count"
echo "- /tmp/schema_fields.txt: Schema field definitions"
echo "- /tmp/console_usage.txt: Console usage patterns"
echo "- /tmp/tech_debt.txt: Technical debt markers"
echo "- /tmp/convex_imports.txt: Convex import patterns"
echo "- /tmp/agent_files.txt: Agent system file count"
echo "- /tmp/largest_components.txt: Largest React components"
echo "- /tmp/largest_functions.txt: Largest Convex functions"
echo "- /tmp/migration_surface.txt: Files needing migration"

# Create combined report
{
    echo "# NodeBench AI Repository Analysis Report"
    echo "Generated: $(date)"
    echo ""
    echo "## File Inventory"
    echo "- TypeScript files: $(cat /tmp/ts_count.txt)"
    echo "- React components: $(cat /tmp/react_components.txt)"
    echo "- Agent system files: $(cat /tmp/agent_files.txt)"
    echo "- Migration surface: $(cat /tmp/migration_surface.txt)"
    echo ""
    echo "## Security & Quality"
    echo "- Console usage patterns:"
    cat /tmp/console_usage.txt
    echo ""
    echo "- Technical debt:"
    cat /tmp/tech_debt.txt
    echo ""
    echo "## Architecture"
    echo "- Largest React components:"
    cat /tmp/largest_components.txt
    echo ""
    echo "- Largest Convex functions:"
    cat /tmp/largest_functions.txt
    echo ""
    echo "## Migration Readiness"
    echo "- Convex functions requiring tRPC: $(cat /tmp/convex_functions.txt)"
    echo "- Schema complexity: $(cat /tmp/schema_fields.txt) field definitions"
} > ./ANALYSIS_REPORT.md

echo "Combined report saved to ./ANALYSIS_REPORT.md"