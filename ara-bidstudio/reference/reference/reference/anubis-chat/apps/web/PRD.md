# 🧰 abubis.chat – Full Product Specification

> **Version:** v1.0.0
> **Date:** August 6, 2025
> **Status:** In Development
> **Maintainers:** [SYMBaiEX](solsymbaiex@gmail.com)

---

## 1. Product Overview

**abubis.chat** is a fully self-contained, Solana-native AI chat SaaS platform that enables users to:

- Authenticate via Solana wallet (no emails/passwords)
- Pay for monthly or yearly Pro access in \$SOL
- Chat with state-of-the-art AI models
- Upload documents and leverage Retrieval-Augmented Generation (RAG) personalized to their wallet
- Access full message history across sessions and devices
- Share conversations, invite others, and go viral with wallet-based referral rewards

The platform is designed for crypto-native users, productivity-focused professionals, and the emerging AI x Web3 builder class.

---

## 2. Functional Features

### 2.1 Wallet Auth

- Solana wallet integration (Phantom, Backpack)
- Message signing for secure identity binding
- No email or PII required

### 2.2 Subscriptions (in \$SOL)

- Monthly (0.15 SOL) and Yearly (1.5 SOL) plans
- Solana smart contract records user plan & expiry
- Grace period logic built into contract
- Convex actions poll chain and update local subscription status

### 2.3 Chat

- AI models via Vercel AI SDK v5.2
- Claude 3.5, GPT-4o, DeepSeek V2, Groq support
- Streaming UI with real-time updates
- Prompt-tool-injection (e.g., RAG, memory recall)

### 2.4 Memory Uploads / RAG

- Users upload documents or notes
- Convex backend extracts text and sends to embedding service
- Vectors stored in Qdrant under wallet key metadata
- Retrieved top-k context chunks injected into prompt during AI call

### 2.5 Full History

- Conversations saved to Convex per user
- Retrieved instantly when user logs in from any device
- Threaded conversation UX

### 2.6 Shareable Outputs

- Export chat snippets as image or animated GIF
- Link contains wallet-based referral code
- Auto-redeems for bonus usage or SOL discount

---

## 3. System Architecture

### 3.1 Frontend

- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Styling: TailwindCSS 3.4
- State: React 19 with server components
- Streaming: Vercel AI SDK v5.2

### 3.2 Backend

- Logic Layer: Convex v1.7+
- Real-time Data: Convex DB + Convex Actions
- Subscriptions: Custom Solana smart contract via Anchor 0.29
- RPC: Helius primary, Shyft fallback

### 3.3 AI & Embeddings

- Provider: Vercel AI SDK multi-model
- Embeddings: OpenAI `text-embedding-3-small`, DeepSeek-V2
- Vector DB: Qdrant v1.9+ hosted on Fly.io or Render

### 3.4 Deployment

- Hosting: Vercel (Frontend + Edge Functions)
- Backend: Convex Cloud
- Vector Infra: Qdrant managed or containerized

---

## 4. UI/UX Design

### 4.1 Layout

- Single-page interface
- Chat left-aligned with infinite scroll
- Right-hand drawer: memory uploads, plan status, referrals
- Top bar: wallet, balance, plan tier, referral link

### 4.2 Typography

- Headers: Satoshi Variable (800 weight)
- Body: Inter
- Code / Mono: IBM Plex Mono

### 4.3 Color System

| Element     | Light   | Dark    |
| ----------- | ------- | ------- |
| Primary     | #14F195 | #14F195 |
| Background  | #F8F9FB | #0E0E10 |
| Text        | #1A1A1A | #F1F1F1 |
| Accent      | #8247E5 | #8247E5 |
| Error/Alert | #FF5F56 | #FF5F56 |

### 4.4 UX Features

- Command bar (`/help`, `/clear`, `/upload`)
- Drag-n-drop upload for memory
- Streaming typing bubble with animated pause dots
- Confetti when SOL payment is successful
- Referral fireworks when a code is redeemed

### 4.5 Accessibility

- WCAG AA compliant contrast ratios
- Keyboard-first navigation
- ARIA labeling for all inputs and buttons

---

## 5. Data Flow

1. **Auth**: Wallet connect → sign → wallet pubkey → Convex `users` table
2. **Subscription**: User signs and sends SOL → on-chain program → Convex reads status
3. **Chat**: User prompt → Convex logs → Qdrant search (if memory exists) → AI SDK stream → UI
4. **Upload**: File drop → Convex Action → embed → Qdrant vector insert (wallet metadata)
5. **Export**: User selects snippet → renders in canvas → downloads image or shares with referral

---

## 6. Security

- Wallet = identity; no traditional auth
- E2E wallet signature validation
- RAG data isolated per wallet
- SOL-based pricing pulled from oracle for fiat clarity
- Rate-limiting per wallet (AI token limits)
- CSP headers, HTTPS enforcement, smart contract audits

---

## 7. Completion Criteria

- All flows work start to finish:

  - Wallet login
  - SOL subscription
  - Chat with memory
  - History persistence
  - Shareable chat snippet

- UI tested on:

  - Desktop (Chrome, Firefox)
  - Mobile Safari + Phantom browser

- Vector memory behaves:

  - Embedded per wallet
  - Only retrievable by origin wallet
  - Purgeable by user on demand
