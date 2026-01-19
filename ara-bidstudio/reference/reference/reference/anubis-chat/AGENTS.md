# AGENTS.md

_Last updated: August 6, 2025_

> **Purpose**: This file provides comprehensive guidance for AI agents (OpenAI Codex, Claude Code, Cursor, GitHub Copilot, and others) working with the ANUBIS Chat codebase. It encodes our coding standards, development workflows, and architectural patterns to ensure consistent, high-quality contributions.

## Project Context

ANUBIS Chat is a **Solana-native AI chat SaaS platform** combining advanced AI/RAG capabilities with Web3 blockchain integration. This monorepo uses **Turborepo** for build orchestration, **Bun** as the package manager, and follows a modular architecture with strict TypeScript and quality standards.

## Quick Navigation

- [Core Commands](#core-commands) - Essential development commands
- [Project Structure](#project-structure) - Codebase organization
- [Coding Conventions](#coding-conventions) - Standards and patterns
- [Testing Instructions](#testing-instructions) - Test execution and coverage
- [AI-Specific Guidelines](#ai-specific-guidelines) - RAG and model integration
- [PR Guidelines](#pr-guidelines) - Pull request standards
- [Common Tasks](#common-tasks) - Frequent development scenarios

## Core Commands

### Essential Development Commands

```bash
# Initial setup (ALWAYS run first for new clones)
bun install
bun dev:setup  # Configure Convex backend

# Development
bun dev         # Start all services (web on :3001, backend)
bun dev:web     # Frontend only
bun dev:server  # Backend only

# Code Quality (MUST pass before commits)
bun check       # Biome format and lint
bun check-types # TypeScript validation

# Build
bun build       # Production build for all apps

# Testing (when implemented)
# bun test       # Run all tests
# bun test:unit  # Unit tests only
# bun test:e2e   # E2E tests
```

### Pre-commit Requirements

**NEVER use `--no-verify` flag**. All commits must pass:

1. `bun check` - Code formatting and linting
2. `bun check-types` - TypeScript validation
3. Commit message format validation

## Project Structure

```
anubis-chat/
├── apps/
│   └── web/                 # Next.js 15 frontend application
│       ├── src/
│       │   ├── app/         # App Router pages & API routes
│       │   ├── components/  # React components
│       │   │   └── ui/      # Shadcn UI primitives
│       │   └── lib/         # Utilities and helpers
│       └── public/          # Static assets and PWA config
│
├── packages/
│   └── backend/             # Convex backend service
│       └── convex/
│           ├── schema.ts    # Database schema definitions
│           ├── *.ts         # Query/mutation functions
│           └── _generated/  # Auto-generated Convex code
│
├── .cursor/rules/           # AI assistant configuration (MDC format)
├── turbo.json              # Turborepo configuration
└── package.json            # Root workspace configuration
```

### Key Files to Understand

- `packages/backend/convex/schema.ts` - Database schema (source of truth)
- `apps/web/src/app/layout.tsx` - Root application layout
- `apps/web/src/components/providers.tsx` - Global providers
- `.cursor/rules/main.mdc` - Primary development guidelines

## Coding Conventions

### TypeScript Standards

```typescript
// ALWAYS use strict mode - NO 'any' types
interface UserData {
  // Prefer interfaces for object shapes
  id: string;
  name: string;
  createdAt: Date;
}

// Use Result pattern for fallible operations
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// Implement proper error handling
async function fetchUser(id: string): Promise<Result<UserData>> {
  try {
    const user = await api.getUser(id);
    return { ok: true, value: user };
  } catch (error) {
    return { ok: false, error };
  }
}
```

### React Component Patterns

```typescript
// Server Components (default) - for data fetching
export default async function UserList() {
  const users = await getUsers(); // Direct async data fetching
  return <UserListClient users={users} />;
}

// Client Components - ONLY for interactivity
"use client";
export function UserListClient({ users }: Props) {
  const [selected, setSelected] = useState<string>();
  // Interactive logic here
}
```

### Convex Backend Patterns

```typescript
// In packages/backend/convex/users.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Type-safe queries
export const getUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Type-safe mutations
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Validation with Zod
    const validated = userSchema.parse(args);
    return await ctx.db.insert("users", validated);
  },
});
```

### Import Organization

```typescript
// 1. External packages
import { useState } from "react";
import { z } from "zod";

// 2. Internal packages
import { api } from "@anubis-chat/backend";

// 3. Local imports
import { Button } from "@/components/ui/button";
import { validateInput } from "@/lib/utils";
```

## Testing Instructions

### Test Execution Commands

```bash
# Run all tests before submitting PR
bun test                    # All tests
bun test:unit              # Unit tests only
bun test:integration       # Integration tests
bun test:e2e               # End-to-end tests

# Coverage requirements
# - Unit: 90%+ statements, 85%+ branches
# - Integration: All API endpoints
# - E2E: Critical user paths
```

### Writing Tests

```typescript
// Unit test example (when implemented)
describe("UserService", () => {
  it("should validate user input", async () => {
    const result = await validateUser({ name: "", email: "invalid" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/validation/);
  });
});
```

## AI-Specific Guidelines

### AI/RAG Integration Patterns

The project is designed for multi-model AI with RAG capabilities:

```typescript
// AI service initialization (planned implementation)
const aiService = new AIService({
  models: ["claude-3.5-sonnet", "gpt-4o", "deepseek-v3"],
  vectorDb: qdrantClient,
  streaming: true,
  fallbackChain: true,
});

// Vector search configuration
const vectorSearch = new VectorSearchService({
  collection: "anubis_knowledge_base",
  searchType: "hybrid", // semantic + keyword
  retrievalStrategy: "contextual",
});
```

### Performance Requirements

- **AI Response**: <2s time-to-first-token
- **Vector Search**: <100ms query time
- **Frontend Load**: <3s on 3G networks
- **API Endpoints**: <200ms average response

## PR Guidelines

### Commit Message Format

```bash
# Required format (enforced by tooling)
feat: Add user authentication
fix: Resolve memory leak in chat component
docs: Update API documentation
refactor: Simplify vector search logic
test: Add unit tests for AI service
chore: Update dependencies
```

### PR Checklist

Before submitting a PR, ensure:

- [ ] All tests pass (`bun test`)
- [ ] Code formatted (`bun check`)
- [ ] TypeScript validates (`bun check-types`)
- [ ] No `console.log` statements
- [ ] No commented-out code
- [ ] Documentation updated if needed
- [ ] Follows existing patterns in codebase

### PR Description Template

```markdown
## Summary

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if UI changes)

[Add screenshots here]
```

## Common Tasks

### Adding a New Feature

1. **Define schema** in `packages/backend/convex/schema.ts`
2. **Create backend functions** in `packages/backend/convex/`
3. **Implement UI components** in `apps/web/src/components/`
4. **Add routing** in `apps/web/src/app/`
5. **Write tests** for all new code
6. **Update documentation** as needed

### Modifying Database Schema

```bash
# 1. Update schema in packages/backend/convex/schema.ts
# 2. Backend will auto-reload and validate
# 3. Update TypeScript types will be auto-generated
# 4. Update related queries/mutations
```

### Adding a New Package

```bash
# From root directory
bun add [package-name]           # Add to root
cd apps/web && bun add [package] # Add to specific workspace
```

### Debugging Common Issues

```bash
# TypeScript errors
bun check-types                  # Check all types
cd apps/web && npx tsc --noEmit  # Check specific app

# Convex connection issues
cd packages/backend && bun dev:setup  # Reconfigure Convex

# Build failures
rm -rf node_modules bun.lockb    # Clear dependencies
bun install                       # Reinstall
```

## Environment Variables

### Required Variables

```bash
# .env.local (apps/web)
NEXT_PUBLIC_CONVEX_URL=         # From Convex dashboard

# .env (packages/backend)
CONVEX_DEPLOYMENT=               # Convex deployment ID
```

### AI Service Variables (Future)

```bash
# When AI integration is implemented
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
QDRANT_URL=
QDRANT_API_KEY=
```

## Security Guidelines

### Input Validation

```typescript
// ALWAYS validate with Zod
const userInputSchema = z.object({
  message: z.string().min(1).max(10000),
  userId: z.string().uuid(),
});

// Validate before processing
const validated = userInputSchema.parse(rawInput);
```

### API Security

- Use parameterized queries (Convex handles this)
- Implement rate limiting for all endpoints
- Validate all inputs with Zod schemas
- Never log sensitive information

## Performance Optimization

### Frontend Optimization

- Use React Server Components by default
- Implement code splitting with dynamic imports
- Optimize images with Next.js Image component
- Use Suspense boundaries for loading states

### Backend Optimization

- Index database queries appropriately
- Implement caching where beneficial
- Use connection pooling (Convex handles this)
- Paginate large result sets

## Directory-Specific Guidelines

### `/apps/web`

- Next.js 15 with App Router
- React Server Components first
- Tailwind CSS for styling
- Shadcn UI for components

### `/packages/backend`

- Convex serverless functions
- Type-safe schema definitions
- Real-time subscriptions
- Automatic scaling

## Updating This File

If you discover new patterns, fix issues, or establish new conventions while working on the codebase, **please update this AGENTS.md file** to keep it current and helpful for future AI agents and developers.

## Additional Resources

- [Cursor Rules](.cursor/rules/main.mdc) - Detailed development guidelines
- [CLAUDE.md](CLAUDE.md) - Claude-specific configuration
- [Convex Documentation](https://docs.convex.dev)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Remember**: The goal is to write code that is maintainable, performant, secure, and follows the established patterns in this codebase. When in doubt, look at existing implementations for guidance.

## Before Writing Code

1. Analyze existing patterns in the codebase
2. Consider edge cases and error scenarios
3. Follow the rules below strictly
4. Validate accessibility requirements

## Rules

### Accessibility (a11y)

- Don't use `accessKey` attribute on any HTML element.
- Don't set `aria-hidden="true"` on focusable elements.
- Don't add ARIA roles, states, and properties to elements that don't support them.
- Don't use distracting elements like `<marquee>` or `<blink>`.
- Only use the `scope` prop on `<th>` elements.
- Don't assign non-interactive ARIA roles to interactive HTML elements.
- Make sure label elements have text content and are associated with an input.
- Don't assign interactive ARIA roles to non-interactive HTML elements.
- Don't assign `tabIndex` to non-interactive HTML elements.
- Don't use positive integers for `tabIndex` property.
- Don't include "image", "picture", or "photo" in img alt prop.
- Don't use explicit role property that's the same as the implicit/default role.
- Make static elements with click handlers use a valid role attribute.
- Always include a `title` element for SVG elements.
- Give all elements requiring alt text meaningful information for screen readers.
- Make sure anchors have content that's accessible to screen readers.
- Assign `tabIndex` to non-interactive HTML elements with `aria-activedescendant`.
- Include all required ARIA attributes for elements with ARIA roles.
- Make sure ARIA properties are valid for the element's supported roles.
- Always include a `type` attribute for button elements.
- Make elements with interactive roles and handlers focusable.
- Give heading elements content that's accessible to screen readers (not hidden with `aria-hidden`).
- Always include a `lang` attribute on the html element.
- Always include a `title` attribute for iframe elements.
- Accompany `onClick` with at least one of: `onKeyUp`, `onKeyDown`, or `onKeyPress`.
- Accompany `onMouseOver`/`onMouseOut` with `onFocus`/`onBlur`.
- Include caption tracks for audio and video elements.
- Use semantic elements instead of role attributes in JSX.
- Make sure all anchors are valid and navigable.
- Ensure all ARIA properties (`aria-*`) are valid.
- Use valid, non-abstract ARIA roles for elements with ARIA roles.
- Use valid ARIA state and property values.
- Use valid values for the `autocomplete` attribute on input elements.
- Use correct ISO language/country codes for the `lang` attribute.

### Code Complexity and Quality

- Don't use consecutive spaces in regular expression literals.
- Don't use the `arguments` object.
- Don't use primitive type aliases or misleading types.
- Don't use the comma operator.
- Don't use empty type parameters in type aliases and interfaces.
- Don't write functions that exceed a given Cognitive Complexity score.
- Don't nest describe() blocks too deeply in test files.
- Don't use unnecessary boolean casts.
- Don't use unnecessary callbacks with flatMap.
- Use for...of statements instead of Array.forEach.
- Don't create classes that only have static members (like a static namespace).
- Don't use this and super in static contexts.
- Don't use unnecessary catch clauses.
- Don't use unnecessary constructors.
- Don't use unnecessary continue statements.
- Don't export empty modules that don't change anything.
- Don't use unnecessary escape sequences in regular expression literals.
- Don't use unnecessary fragments.
- Don't use unnecessary labels.
- Don't use unnecessary nested block statements.
- Don't rename imports, exports, and destructured assignments to the same name.
- Don't use unnecessary string or template literal concatenation.
- Don't use String.raw in template literals when there are no escape sequences.
- Don't use useless case statements in switch statements.
- Don't use ternary operators when simpler alternatives exist.
- Don't use useless `this` aliasing.
- Don't use any or unknown as type constraints.
- Don't initialize variables to undefined.
- Don't use the void operators (they're not familiar).
- Use arrow functions instead of function expressions.
- Use Date.now() to get milliseconds since the Unix Epoch.
- Use .flatMap() instead of map().flat() when possible.
- Use literal property access instead of computed property access.
- Don't use parseInt() or Number.parseInt() when binary, octal, or hexadecimal literals work.
- Use concise optional chaining instead of chained logical expressions.
- Use regular expression literals instead of the RegExp constructor when possible.
- Don't use number literal object member names that aren't base 10 or use underscore separators.
- Remove redundant terms from logical expressions.
- Use while loops instead of for loops when you don't need initializer and update expressions.
- Don't pass children as props.
- Don't reassign const variables.
- Don't use constant expressions in conditions.
- Don't use `Math.min` and `Math.max` to clamp values when the result is constant.
- Don't return a value from a constructor.
- Don't use empty character classes in regular expression literals.
- Don't use empty destructuring patterns.
- Don't call global object properties as functions.
- Don't declare functions and vars that are accessible outside their block.
- Make sure builtins are correctly instantiated.
- Don't use super() incorrectly inside classes. Also check that super() is called in classes that extend other constructors.
- Don't use variables and function parameters before they're declared.
- Don't use 8 and 9 escape sequences in string literals.
- Don't use literal numbers that lose precision.

### React and JSX Best Practices

- Don't use the return value of React.render.
- Make sure all dependencies are correctly specified in React hooks.
- Make sure all React hooks are called from the top level of component functions.
- Don't forget key props in iterators and collection literals.
- Don't destructure props inside JSX components in Solid projects.
- Don't define React components inside other components.
- Don't use event handlers on non-interactive elements.
- Don't assign to React component props.
- Don't use both `children` and `dangerouslySetInnerHTML` props on the same element.
- Don't use dangerous JSX props.
- Don't use Array index in keys.
- Don't insert comments as text nodes.
- Don't assign JSX properties multiple times.
- Don't add extra closing tags for components without children.
- Use `<>...</>` instead of `<Fragment>...</Fragment>`.
- Watch out for possible "wrong" semicolons inside JSX elements.

### Correctness and Safety

- Don't assign a value to itself.
- Don't return a value from a setter.
- Don't compare expressions that modify string case with non-compliant values.
- Don't use lexical declarations in switch clauses.
- Don't use variables that haven't been declared in the document.
- Don't write unreachable code.
- Make sure super() is called exactly once on every code path in a class constructor before this is accessed if the class has a superclass.
- Don't use control flow statements in finally blocks.
- Don't use optional chaining where undefined values aren't allowed.
- Don't have unused function parameters.
- Don't have unused imports.
- Don't have unused labels.
- Don't have unused private class members.
- Don't have unused variables.
- Make sure void (self-closing) elements don't have children.
- Don't return a value from a function with the return type 'void'
- Use isNaN() when checking for NaN.
- Make sure "for" loop update clauses move the counter in the right direction.
- Make sure typeof expressions are compared to valid values.
- Make sure generator functions contain yield.
- Don't use await inside loops.
- Don't use bitwise operators.
- Don't use expressions where the operation doesn't change the value.
- Make sure Promise-like statements are handled appropriately.
- Don't use **dirname and **filename in the global scope.
- Prevent import cycles.
- Don't use configured elements.
- Don't hardcode sensitive data like API keys and tokens.
- Don't let variable declarations shadow variables from outer scopes.
- Don't use the TypeScript directive @ts-ignore.
- Prevent duplicate polyfills from Polyfill.io.
- Don't use useless backreferences in regular expressions that always match empty strings.
- Don't use unnecessary escapes in string literals.
- Don't use useless undefined.
- Make sure getters and setters for the same property are next to each other in class and object definitions.
- Make sure object literals are declared consistently (defaults to explicit definitions).
- Use static Response methods instead of new Response() constructor when possible.
- Make sure switch-case statements are exhaustive.
- Make sure the `preconnect` attribute is used when using Google Fonts.
- Use `Array#{indexOf,lastIndexOf}()` instead of `Array#{findIndex,findLastIndex}()` when looking for the index of an item.
- Make sure iterable callbacks return consistent values.
- Use `with { type: "json" }` for JSON module imports.
- Use numeric separators in numeric literals.
- Use object spread instead of `Object.assign()` when constructing new objects.
- Always use the radix argument when using `parseInt()`.
- Make sure JSDoc comment lines start with a single asterisk, except for the first one.
- Include a description parameter for `Symbol()`.
- Don't use spread (`...`) syntax on accumulators.
- Don't use the `delete` operator.
- Don't access namespace imports dynamically.
- Don't use namespace imports.
- Declare regex literals at the top level.
- Don't use `target="_blank"` without `rel="noopener"`.

### TypeScript Best Practices

- Don't use TypeScript enums.
- Don't export imported variables.
- Don't add type annotations to variables, parameters, and class properties that are initialized with literal expressions.
- Don't use TypeScript namespaces.
- Don't use non-null assertions with the `!` postfix operator.
- Don't use parameter properties in class constructors.
- Don't use user-defined types.
- Use `as const` instead of literal types and type annotations.
- Use either `T[]` or `Array<T>` consistently.
- Initialize each enum member value explicitly.
- Use `export type` for types.
- Use `import type` for types.
- Make sure all enum members are literal values.
- Don't use TypeScript const enum.
- Don't declare empty interfaces.
- Don't let variables evolve into any type through reassignments.
- Don't use the any type.
- Don't misuse the non-null assertion operator (!) in TypeScript files.
- Don't use implicit any type on variable declarations.
- Don't merge interfaces and classes unsafely.
- Don't use overload signatures that aren't next to each other.
- Use the namespace keyword instead of the module keyword to declare TypeScript namespaces.

### Style and Consistency

- Don't use global `eval()`.
- Don't use callbacks in asynchronous tests and hooks.
- Don't use negation in `if` statements that have `else` clauses.
- Don't use nested ternary expressions.
- Don't reassign function parameters.
- This rule lets you specify global variable names you don't want to use in your application.
- Don't use specified modules when loaded by import or require.
- Don't use constants whose value is the upper-case version of their name.
- Use `String.slice()` instead of `String.substr()` and `String.substring()`.
- Don't use template literals if you don't need interpolation or special-character handling.
- Don't use `else` blocks when the `if` block breaks early.
- Don't use yoda expressions.
- Don't use Array constructors.
- Use `at()` instead of integer index access.
- Follow curly brace conventions.
- Use `else if` instead of nested `if` statements in `else` clauses.
- Use single `if` statements instead of nested `if` clauses.
- Use `new` for all builtins except `String`, `Number`, and `Boolean`.
- Use consistent accessibility modifiers on class properties and methods.
- Use `const` declarations for variables that are only assigned once.
- Put default function parameters and optional function parameters last.
- Include a `default` clause in switch statements.
- Use the `**` operator instead of `Math.pow`.
- Use `for-of` loops when you need the index to extract an item from the iterated array.
- Use `node:assert/strict` over `node:assert`.
- Use the `node:` protocol for Node.js builtin modules.
- Use Number properties instead of global ones.
- Use assignment operator shorthand where possible.
- Use function types instead of object types with call signatures.
- Use template literals over string concatenation.
- Use `new` when throwing an error.
- Don't throw non-Error values.
- Use `String.trimStart()` and `String.trimEnd()` over `String.trimLeft()` and `String.trimRight()`.
- Use standard constants instead of approximated literals.
- Don't assign values in expressions.
- Don't use async functions as Promise executors.
- Don't reassign exceptions in catch clauses.
- Don't reassign class members.
- Don't compare against -0.
- Don't use labeled statements that aren't loops.
- Don't use void type outside of generic or return types.
- Don't use console.
- Don't use control characters and escape sequences that match control characters in regular expression literals.
- Don't use debugger.
- Don't assign directly to document.cookie.
- Use `===` and `!==`.
- Don't use duplicate case labels.
- Don't use duplicate class members.
- Don't use duplicate conditions in if-else-if chains.
- Don't use two keys with the same name inside objects.
- Don't use duplicate function parameter names.
- Don't have duplicate hooks in describe blocks.
- Don't use empty block statements and static blocks.
- Don't let switch clauses fall through.
- Don't reassign function declarations.
- Don't allow assignments to native objects and read-only global variables.
- Use Number.isFinite instead of global isFinite.
- Use Number.isNaN instead of global isNaN.
- Don't assign to imported bindings.
- Don't use irregular whitespace characters.
- Don't use labels that share a name with a variable.
- Don't use characters made with multiple code points in character class syntax.
- Make sure to use new and constructor properly.
- Don't use shorthand assign when the variable appears on both sides.
- Don't use octal escape sequences in string literals.
- Don't use Object.prototype builtins directly.
- Don't redeclare variables, functions, classes, and types in the same scope.
- Don't have redundant "use strict".
- Don't compare things where both sides are exactly the same.
- Don't let identifiers shadow restricted names.
- Don't use sparse arrays (arrays with holes).
- Don't use template literal placeholder syntax in regular strings.
- Don't use the then property.
- Don't use unsafe negation.
- Don't use var.
- Don't use with statements in non-strict contexts.
- Make sure async functions actually use await.
- Make sure default clauses in switch statements come last.
- Make sure to pass a message value when creating a built-in error.
- Make sure get methods always return a value.
- Use a recommended display strategy with Google Fonts.
- Make sure for-in loops include an if statement.
- Use Array.isArray() instead of instanceof Array.
- Make sure to use the digits argument with Number#toFixed().
- Make sure to use the "use strict" directive in script files.

### Next.js Specific Rules

- Don't use `<img>` elements in Next.js projects.
- Don't use `<head>` elements in Next.js projects.
- Don't import next/document outside of pages/\_document.jsx in Next.js projects.
- Don't use the next/head module in pages/\_document.js on Next.js projects.

### Testing Best Practices

- Don't use export or module.exports in test files.
- Don't use focused tests.
- Make sure the assertion function, like expect, is placed inside an it() function call.
- Don't use disabled tests.

## Common Tasks

### Using Ultracite for Code Quality

The project uses Ultracite (via Biome) for formatting and linting:

```bash
# Format and fix code automatically
npx ultracite format

# Check for issues without fixing
npx ultracite lint

# Initialize Ultracite in new projects
npx ultracite init
```

## Example: Error Handling

```typescript
// ✅ Good: Comprehensive error handling
try {
  const result = await fetchData();
  return { success: true, data: result };
} catch (error) {
  console.error("API call failed:", error);
  return { success: false, error: error.message };
}

// ❌ Bad: Swallowing errors
try {
  return await fetchData();
} catch (e) {
  console.log(e);
}
```
