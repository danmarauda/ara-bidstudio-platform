# Repository Guidelines

## Overview

This is a Convex + Next.js + WorkOS AuthKit app (`README.md:1-12`).
- Backend: Convex functions in `convex/` with a simple `numbers` table (`convex/myFunctions.ts:1-78`, `convex/schema.ts:1-12`).
- Frontend: Next.js App Router under `app/` using Convex React hooks and WorkOS AuthKit (`app/page.tsx:1-150`, `app/layout.tsx:1-36`, `app/server/page.tsx:1-30`).
- Auth: WorkOS AuthKit wired via Next.js routes and Convex auth config (`convex/auth.config.ts`, `app/sign-in/route.ts`, `app/sign-up/route.ts`, `middleware.ts`).

## Build, Run, and Tooling Commands

From `package.json:14-22`:
- Install deps: `npm install` (or any compatible Node package manager; `bun.lock` exists but no Bun scripts are defined).
- Dev (Next + Convex): `npm run dev`
  - Runs `npm-run-all --parallel dev:frontend dev:backend`.
  - Frontend only: `npm run dev:frontend` → `next dev`.
  - Backend only: `npm run dev:backend` → `convex dev`.
- Build frontend: `npm run build` → `next build`.
- Start production (frontend only): `npm start` → `next start`.
- Lint: `npm run lint` → `next lint` (configured via `eslint.config.mjs:1-14`).
- Format: `npm run format` → `prettier --write .`.

Convex-specific CLI (from `README.md:32-47` and `convex/README.md:86-88`):
- Initialize/attach Convex deployment: `npx convex dev` (also used in `predev`).
- Configure WorkOS auth in Convex: `npx convex auth add workos` (creates/updates `convex/auth.config.ts`).
- General Convex help/docs: `npx convex -h`, `npx convex docs`.

## Project Structure

Top-level (`ls:1-24`):
- `app/`: Next.js App Router pages and routes.
- `components/`: Shared React components, currently `ConvexClientProvider.tsx` (used in `app/layout.tsx:24-33`).
- `convex/`: Convex backend (schema, functions, generated types, auth config).
- `public/`: Static assets (e.g. `convex.svg`).
- Config: `eslint.config.mjs`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `prettier.config.mjs`, `.prettierignore`, `.gitignore`, `.env.local.example`, `pnpm-workspace.yaml`, `bun.lock`.
- Docs & meta: `README.md`, `LICENSE`, `.cursor/rules/convex_rules.mdc`, `.swarm/`, `.claude-flow/`.

### Frontend (`app/`)

- `app/layout.tsx:1-36`:
  - Defines `RootLayout` and global `metadata` (title/description/icons).
  - Wraps all pages with `ConvexClientProvider` and applies Geist fonts.
- `app/page.tsx:1-150` (main client page):
  - Marked `'use client'` and uses Convex React hooks (`Authenticated`, `Unauthenticated`, `useQuery`, `useMutation`) and WorkOS `useAuth`.
  - `Home` component renders header with user info and conditional content.
  - `Content`:
    - Calls `useQuery(api.myFunctions.listNumbers, { count: 10 })`.
    - Uses `useMutation(api.myFunctions.addNumber)` to insert random numbers.
    - Shows current viewer and list of numbers; links to `/server` for server-side data loading.
  - `SignInForm` provides links to `/sign-in` and `/sign-up` routes.
  - `ResourceCard` is a presentational component; note external URLs are hard-coded.
  - `UserMenu` uses WorkOS `User` type and `onSignOut` handler.
- `app/server/page.tsx:1-30`:
  - Server component using `withAuth` to get an access token.
  - Uses `preloadQuery` / `preloadedQueryResult` with `api.myFunctions.listNumbers` to fetch non-reactive data on the server.
  - Renders raw JSON of preloaded data plus a hydrated `Home` component from `./inner`.
- `app/server/inner.tsx` (not shown here) contains the client component that consumes the preloaded query; follow existing pattern if adding more preloaded Convex data.
- `app/sign-in/route.ts`, `app/sign-up/route.ts`, `app/callback/route.ts` exist and implement WorkOS redirect flows and callback handling (inspect these files when changing auth behavior).
- `app/globals.css` defines global Tailwind-based styles and is imported in `app/layout.tsx:3`.

### Backend (`convex/`)

- `convex/schema.ts:1-12`:
  - Defines `numbers` table with a single numeric `value` field via `defineSchema` / `defineTable`.
- `convex/myFunctions.ts:1-78`:
  - Uses `query`, `mutation`, and `action` from `./_generated/server` and `v` validators.
  - `listNumbers` query:
    - Args: `{ count: v.number() }`.
    - Reads from the `numbers` table, orders by `_creationTime` descending, takes `count` documents.
    - Returns `{ viewer, numbers }`, where `viewer` is the Convex auth subject or `null`, and `numbers` is a reversed array of `value` fields.
  - `addNumber` mutation:
    - Args: `{ value: v.number() }`.
    - Inserts `{ value }` into `numbers` and logs the new document id.
  - `myAction` action:
    - Args: `{ first: v.number(), second: v.string() }`.
    - Demonstrates `ctx.runQuery(api.myFunctions.listNumbers, { count: 10 })` and `ctx.runMutation(api.myFunctions.addNumber, { value: args.first })`.
- `convex/auth.config.ts`:
  - Configures Convex to use WorkOS for authentication (created by `npx convex auth add workos`). When editing, follow the Convex docs and WorkOS setup in `README.md:21-50`.
- `convex/_generated/`:
  - `api.d.ts` / `api.js` export typed function references like `api.myFunctions.listNumbers` used on the frontend and in actions.
  - `server.d.ts` / `server.js` expose Convex server utilities (`query`, `mutation`, `action`, `internal*`).
- `convex/tsconfig.json` scopes TS config for backend functions.
- `convex/README.md:1-88` contains generic Convex function examples and usage notes for queries, mutations, actions, and the CLI.

## Coding Style & Naming Conventions

From existing guidelines (`AGENTS.md:16-21`, `.cursor/rules/convex_rules.mdc:6-215`, and observed code):
- Language: TypeScript across frontend and backend.
- String style: Single quotes in custom code (e.g. `app/page.tsx:1-150`, `convex/myFunctions.ts:1-78`).
- Formatting:
  - Use Prettier via `npm run format` and existing `prettier.config.mjs` / `.prettierignore`.
  - Tailwind utility classes are used for styling (see `app/page.tsx:14-25`, `app/server/page.tsx:18-27`).
- Naming:
  - React components: PascalCase (`Home`, `Content`, `ResourceCard`, `UserMenu`, `RootLayout`).
  - Convex functions: camelCase for exported function names (`listNumbers`, `addNumber`, `myAction`).
  - Variables and props: camelCase.
- Convex-specific (`.cursor/rules/convex_rules.mdc:6-215` and `convex/myFunctions.ts:1-78`):
  - Always use the new function syntax: `export const fn = query({ args: {...}, returns: ..., handler: async (ctx, args) => { ... } })`.
  - Always include argument validators for all Convex functions.
  - When returning `null`, use `returns: v.null()`.
  - Use `Id<'tableName'>` types via `./_generated/dataModel` when dealing with document ids.
  - Use `ctx.runQuery`, `ctx.runMutation`, `ctx.runAction` with `api.*`/`internal.*` function references, not direct function calls.
  - Prefer `withIndex` over `filter` and define necessary indexes in `convex/schema.ts` (see `.cursor/rules/convex_rules.mdc:227-235`).

## Testing

- No dedicated test framework is configured in `package.json` (no `test` script and no Jest/Vitest dependencies).
- The existing `AGENTS.md:31-34` suggests using Jest/Vitest and `*.test.ts`/`*.spec.ts` naming, but there are currently no test files in the repo.
- If you add tests, create a `test` script in `package.json` and follow the suggested file naming; keep tooling consistent with the rest of the TypeScript / Next.js setup.

## Auth & Middleware

- WorkOS AuthKit is the primary auth mechanism:
  - Client side: `useAuth()` hook from `@workos-inc/authkit-nextjs/components` (`app/page.tsx:6-11`).
  - Server side: `withAuth()` from `@workos-inc/authkit-nextjs` (`app/server/page.tsx:4-8`).
- Auth routes:
  - `app/sign-in/route.ts` and `app/sign-up/route.ts` handle sign-in/sign-up flows.
  - `app/callback/route.ts` handles the WorkOS redirect URI specified in `README.md:25-30`.
- `middleware.ts` configures Next.js middleware for route protection using WorkOS (inspect this file when modifying auth or protected routes).
- Environment variables:
  - `.env.local.example` documents required variables (WorkOS client id, API key, cookie password, Convex deployment URL, etc.).
  - Copy to `.env.local` and fill in actual values for local dev (`README.md:21-30`, `README.md:32-41`).

## Convex Guidelines and Gotchas

From `.cursor/rules/convex_rules.mdc` and the current implementation:
- Always define schema in `convex/schema.ts` and keep it in sync with actual tables.
- Avoid `ctx.db.query(...).filter(...)` – define an index in the schema and use `withIndex` instead.
- Queries/mutations are transactional; minimize splitting logic across multiple calls to avoid race conditions.
- Actions:
  - Add `"use node";` at the top of actions that use Node built-ins or Node-only libraries.
  - Do not use `ctx.db` directly inside actions; instead, call queries/mutations via `ctx.runQuery` / `ctx.runMutation`.
- Use `ctx.db.replace` for full document replacement and `ctx.db.patch` for partial updates (see `.cursor/rules/convex_rules.mdc:239-240`).
- For pagination, use `paginationOptsValidator` and return Convex pagination objects instead of manual skip/limit (`.cursor/rules/convex_rules.mdc:149-175`).
- For file storage, use `_storage` system table and `ctx.storage.getUrl()` as shown in `.cursor/rules/convex_rules.mdc:288-316`.

## Next.js & Convex Integration Patterns

- Client-side data loading:
  - Use `useQuery(api.someFunction, args)` for live, reactive data in client components.
  - Use `useMutation(api.someMutation)` for writes.
  - The pattern in `app/page.tsx:45-73` is the reference for simple Convex-backed UI.
- Server-side data loading:
  - Use `preloadQuery` and `preloadedQueryResult` from `convex/nextjs` with `withAuth()` for authenticated server components (`app/server/page.tsx:1-18`).
  - Pass `preloaded` query handles into client components, which can then use the data.
- Provider setup:
  - `ConvexClientProvider` wraps the app in `RootLayout` and should be the only place where the Convex client is instantiated.
  - When adding more providers, keep `ConvexClientProvider` at a top level so hooks like `useQuery` work correctly.

## Linting, Formatting, and TypeScript

- ESLint configuration (`eslint.config.mjs:1-13`):
  - Uses `next/core-web-vitals` and `next/typescript` presets via `FlatCompat`.
  - Run `npm run lint` to validate code quality.
- Prettier configuration (`prettier.config.mjs` and `.prettierignore`):
  - Use `npm run format` to apply formatting; respect ignore patterns.
- TypeScript config (`tsconfig.json`, `convex/tsconfig.json`):
  - The main TS config governs Next.js/React app; Convex has its own TS config for backend functions.
  - Keep strict typing, especially around Convex Ids and return types, consistent with `.cursor/rules/convex_rules.mdc:188-215`.

## How to Extend This Project Safely

When adding or modifying functionality:

1. **New Convex functions**
   - Place them in appropriate files under `convex/` (or create new files to organize domains).
   - Follow the new function syntax and include full argument validators and return types.
   - Update `convex/schema.ts` if new tables or fields are needed; add indexes instead of using `filter`.
   - Use `api.*` references and `ctx.runQuery`/`ctx.runMutation` for cross-function calls.

2. **New frontend features**
   - For client components, follow patterns in `app/page.tsx:9-149` (hooks, conditional rendering based on auth, Tailwind classes).
   - For server components, follow `app/server/page.tsx:6-28` (use `withAuth`, `preloadQuery`).
   - Add new routes under `app/` using App Router conventions.

3. **Auth-related changes**
   - Coordinate updates between WorkOS dashboard, `.env.local`, `convex/auth.config.ts`, and Next.js routes/middleware.
   - Test login, logout, and access to protected routes after changes.

4. **Tooling**
   - Use existing scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm run format`.
   - If you add tests or other tools, extend `package.json` scripts rather than inventing new ad-hoc commands.

## Known Assumptions and Missing Pieces

- There is no `test` script or test framework configured; tests are currently manual or ad-hoc.
- `bun.lock` exists but there are no Bun-specific scripts in `package.json`; npm (or pnpm/yarn) is the primary workflow.
- Deployment configuration is not defined in this repo; follow Convex and Next.js deployment docs as needed.
