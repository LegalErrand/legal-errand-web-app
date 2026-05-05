<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# LegalErrand Web App — Agent Rules

> Every AI agent (or human contributor) working in this repository **must** read and follow these rules before writing a single line of code.

---

## 1. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 — App Router |
| Language | TypeScript (strict) |
| Styles | SCSS Modules — no Tailwind, no CSS-in-JS |
| State | React `useState` / `useReducer` — no external state lib |
| Fetching | Native `fetch` via `src/lib/api.ts` |
| Error tracking | Sentry (`@sentry/nextjs`) |
| Analytics | `@vercel/analytics` + `@vercel/speed-insights` |

---

## 2. File & Folder Conventions

```
src/
  app/           # Next.js App Router pages & layouts
  components/    # UI components only — no business logic
  lib/           # Pure logic: api, types, constants, validation, geo
  styles/        # Global SCSS variables, reset, globals
```

- **One component per file.** File name = component name (PascalCase).
- Every component gets its own `ComponentName.module.scss`.
- Library files live in `src/lib/` — no imports from `src/components/` inside `src/lib/`.

---

## 3. The 200-Line Rule

> **No component file may exceed 200 lines of code.**

If a component approaches 200 lines:
1. Extract sub-components into their own files.
2. Move constants/types to `src/lib/constants.ts` / `src/lib/types.ts`.
3. Move validation logic to `src/lib/validation.ts`.
4. Move API calls to `src/lib/api.ts`.

---

## 4. Components Are Strictly UI

Components **must not**:
- Contain business logic or validation rules.
- Directly call `fetch` or any external service.
- Define constants, enums, or TypeScript interfaces inline.

Components **must**:
- Accept data and callbacks via props.
- Delegate API calls to `src/lib/api.ts`.
- Import types from `src/lib/types.ts`.
- Import constants from `src/lib/constants.ts`.

---

## 5. Constants & Types Live Outside Components

```ts
// ✅ correct
import { LEVELS, SPOTS_LEFT } from '@/lib/constants';
import type { WaitlistFormData } from '@/lib/types';

// ❌ wrong — defining inline in a component
const LEVELS = ['100 Level', '200 Level'];
interface FormData { firstName: string; }
```

---

## 6. API Layer Rules (`src/lib/api.ts`)

- Base URL comes from `process.env.NEXT_PUBLIC_API_BASE_URL`.
- All fetch calls go through the typed `apiFetch` helper.
- Mutations use `cache: 'no-store'`.
- Reads use `next: { revalidate: 60 }` (or appropriate TTL).
- File uploads use `FormData` — never set `Content-Type` manually for multipart.
- Every function must have explicit TypeScript return types.

---

## 7. Error Handling

- All API calls must be wrapped in try/catch.
- Surface user-facing errors via form error state — never `console.error` as the only handler.
- Server errors are captured by Sentry automatically via `instrumentation.ts`.
- Client errors are captured via `ErrorBoundary` wrapping the app root.

---

## 8. Styling Rules

- Variables are in `src/styles/_variables.scss` — never hard-code hex values in component SCSS.
- Use `@use '../styles/variables' as *` (or relative path) at the top of every module.
- No global class names — every selector lives inside a module.
- Mobile-first: default styles target mobile, `@media (min-width: 900px)` for desktop.
- No `!important`.

---

## 9. Git Workflow

- **Never commit directly to `production`.**
- Feature branches cut from `dev`, PR into `dev`.
- `production` receives PRs from `dev` only after QA.
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`.

---

## 10. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | API base URL (e.g. `http://localhost:5000/api/v1`) |
| `NEXT_PUBLIC_SENTRY_DSN` | Yes (prod) | Sentry DSN for error tracking |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL for SEO |

Copy `.env.local.example` to `.env.local` and fill in values before running locally.
