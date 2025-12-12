# TinyTorch Systems

TinyTorch is a modern web platform built with **Next.js 15** and **Supabase**, designed to power community challenges, leaderboard systems, and CLI-based interactions. It features a robust, secure authentication system supporting both web and command-line interface (CLI) workflows.

## 🏗 Architecture

The project follows a full-stack serverless architecture hosted on Netlify, leveraging Next.js App Router for both frontend UI and backend API routes.

### Core Components

*   **Frontend:** React 19, Tailwind CSS v4, Lucide Icons.
*   **Backend:** Next.js Server Actions & API Routes.
*   **Database & Auth:** Supabase (PostgreSQL, GoTrue).
*   **Edge Functions:** Supabase Edge Functions (for profile updates).

### System Overview

```
[User Browser / CLI] 
      |
      v
[Next.js App Router (Netlify)]
      |-- Pages (@app/*)           -> Server Components & Client UI
      |-- Server Actions           -> Form handling (Login, Signup)
      |-- API Routes (@app/api/*)  -> JSON endpoints for external clients/CLI
      |
      v
[Supabase Platform]
      |-- Auth (Users, Sessions, PKCE)
      |-- Database (Public Schema)
      |-- Edge Functions
```

---

## 🔐 Authentication & Security

This project implements a highly secure, flexible authentication flow designed to handle **Cross-Site Requests** (from local dev environments or separate frontends) and **Deep Linking** (redirection after email confirmation).

### Key Features

1.  **Dual Auth Flows:**
    *   **Web Flow:** Standard username/password login with Next.js Server Actions.
    *   **API/CLI Flow:** JSON-based endpoints (`/api/auth/signup`) supporting external clients (e.g., `localhost:8000`, Python CLI).

2.  **Smart Redirection System (`redirect_to`):**
    *   The system accepts a `redirect_to` parameter during login/signup.
    *   **Security:** Only whitelisted internal paths (starting with `/`) and specific external origins (defined in `ALLOWED_ORIGINS`) are permitted.
    *   **Persistence:** The redirect target is preserved through the entire email confirmation lifecycle.
        *   User signs up -> Email sent -> User clicks link -> Redirected to `/auth/confirm` -> Redirected to original target.

3.  **Cross-Site Cookie Support:**
    *   Critical for local development (`localhost`) interacting with the production API.
    *   Cookies (PKCE Verifiers) are set with `SameSite=None; Secure`.
    *   CORS headers include `Access-Control-Allow-Credentials: true`.

### Configuration (`utils/config.ts`)

Centralized configuration manages environment-specific URLs and allowed origins for CORS/Redirection.

```typescript
export const ALLOWED_ORIGINS = [
  'http://localhost:8000', // Local frontend dev
  'https://mlsysbook.ai',  // Production frontend
  // ...
]
```

---

## 📂 Project Structure

```bash
/app
├── (auth)              # Authentication pages (Login, Reset Password)
│   ├── login/          # Login/Signup page & Server Actions
│   └── ...
├── api                 # API Endpoints (JSON)
│   ├── auth/           # Auth APIs (Signup, etc.) used by external clients
│   └── ...
├── auth                # Auth Handlers
│   └── confirm/        # Route handler for Email Confirmation/PKCE exchange
├── cli-login           # Dedicated flow for CLI tool authentication
├── dashboard           # Protected user dashboard
└── ...

/lib
├── cors.ts             # Centralized CORS logic with credentials support
└── location-service.ts # Geo-location utilities

/utils
├── config.ts           # Global config (URLs, Origins)
└── supabase/           # Supabase client factories (Server, Client, Middleware)
```

---

## 🚀 Getting Started

### Prerequisites

*   Node.js 18+
*   npm / yarn / pnpm

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000 # or your production URL
```

### Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## 🛠 Key Workflows Explained

### 1. API Signup with Redirect (External Frontend)

1.  **Request:** External frontend sends `POST /api/auth/signup` with `{ email, password, redirect_to: "http://localhost:8000/dashboard" }`.
2.  **Processing:**
    *   API validates origin against whitelist.
    *   Constructs email link: `.../auth/confirm?next=http://localhost:8000/dashboard`.
3.  **Confirmation:**
    *   User clicks email link.
    *   Lands on `/auth/confirm`.
    *   Server exchanges PKCE code for session.
    *   Server redirects user to `http://localhost:8000/dashboard` with session cookies.

### 2. CLI Login

1.  CLI opens browser to `/cli-login?redirect_port=12345`.
2.  User logs in via web UI.
3.  Server redirects to `http://127.0.0.1:12345/callback` with access tokens in the URL.
4.  CLI captures tokens and closes browser.