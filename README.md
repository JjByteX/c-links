# C-Links

A web app for managing the links behind C-Links NFC cards. Each card holds one permanent short link, and a partner sets where that link goes. Customers never sign in. They only see the destination page.

This is a school project.

## How it works

1. A partner signs in and adds a card with a label and a destination URL.
2. The app creates a permanent short link (`/c/<code>`) and copies it to the clipboard.
3. The partner writes that short link to the chip once, using an NFC writing app.
4. When the destination changes, the partner edits the card. The chip is never rewritten.

## Status

| Part | State |
|------|-------|
| Partner sign-in (email and password) | Built |
| Cards screen: add, edit, delete, copy short link, tap count | Built |
| Public short link `/c/<code>` (counts the tap, redirects) | Not built |
| Forgot password | Not built |

## Stack

Next.js 16 (App Router), React 19, Mantine 9, TypeScript, Supabase (database and auth), Tabler Icons, hosted on Vercel.

## Setup

Requires Node.js 22 or newer.

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create a Supabase project, then run the SQL in `supabase/migrations/` in the Supabase SQL editor.

3. In the Supabase dashboard, open Authentication and turn off public sign-ups. Every signed-in user is treated as a partner, so partners are added by hand in the dashboard.

4. Copy `.env.example` to `.env.local` and fill it in.

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL from Supabase |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key from Supabase |
   | `NEXT_PUBLIC_SITE_URL` | The deployed address, for example `https://your-project.vercel.app` |

   Never commit `.env.local`.

5. Start the app.

   ```bash
   npm run dev
   ```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript check |

## Project documents

The rules and decisions behind the project live in [`docs/`](docs):

- `project-brief.md`: what is being built and what done looks like
- `architecture-notes.md`: stack, folder structure, and how files connect
- `constraints.md`: rules that must not be broken
- `decision-log.md`: major decisions and the reasons for them
- `open-questions.md`: questions waiting on a human decision
- `ux-ui-guidelines.md`: rules for every UI decision
- `ci-cd.md`: automated checks and deployment

## License

MIT
