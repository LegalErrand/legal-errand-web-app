# LegalErrand Web App

Student-facing Next.js app for LegalErrand Academy — AI-native study platform for Nigerian law students.

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** SCSS Modules (no Tailwind)
- **Monitoring:** Sentry, Vercel Analytics + Speed Insights
- **API:** `legalerrand-api` (Express REST)

## Getting Started

```bash
cp .env.example .env.local   # fill in your values
npm install
npm run dev                  # http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run lint` | ESLint |

## Project Structure

```
src/
├── app/
│   ├── (auth)/             # Login, signup, OTP, bio-data, password reset
│   ├── (dashboard)/        # Authenticated student dashboard
│   │   └── dashboard/
│   │       ├── cases/      # Case law browser
│   │       ├── library/    # Document library
│   │       ├── notes/      # Notes CRUD
│   │       ├── quiz/       # Quiz sessions
│   │       ├── research/   # AI research tool
│   │       ├── reasoning/  # Legal reasoning practice
│   │       └── progress/   # Study progress
│   └── page.tsx            # Landing / waitlist
├── components/             # Shared UI (barrel: @/components)
│   ├── SearchableSelect/   # Dropdown with search
│   ├── CountrySelect/      # Country picker with auto-detect
│   ├── DocCard/            # Document card
│   └── ui/                 # Button, etc.
├── lib/                    # Utilities (barrel: @/lib)
│   ├── api.ts              # Axios client
│   ├── constants.ts        # Universities, countries, levels
│   ├── validation.ts       # Zod schemas
│   └── types.ts            # Shared types
└── styles/                 # Global SCSS + variables
```

## Conventions

- No Tailwind — SCSS Modules only
- No inline styles, no hardcoded values
- No file over 200 lines
- All component imports from `@/components`, all lib imports from `@/lib`
