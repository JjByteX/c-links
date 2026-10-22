# C-Links

A very simple web app for adding and managing the links behind NFC cards, used for business cards and promotional items.

Live at https://c-links.vercel.app

## What it does

Each NFC card holds one permanent short link, for example `https://c-links.vercel.app/c/a1b2c3d4`. When someone taps the card, the app counts the tap and redirects them to the destination the partner set. Changing where a card points never means rewriting the chip.

- **Cards**: add a card with a label and a destination URL, edit it, copy its short link, and see its tap count.
- **Redirect**: the public short link counts the tap and sends the visitor to the destination. A code that does not exist gets a plain 404.
- **Chip writing**: write a card's short link to an NFC chip from the Cards list. This works only in Chrome on Android with NFC turned on. On every other browser, copy the link and use an NFC writing app.
- **Partners**: list partner accounts and add new ones. Any signed-in partner can add another.

## Who it is for

The five C-Links partners, who sign in and manage cards for customers. Customers do not sign in. Card holders and the people who tap their cards only ever see the destination page.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Mantine 9 for components, Tabler Icons for icons
- Source Serif 4 and Source Sans 3 fonts
- Supabase for the database and partner sign-in (email and password)
- Vercel for hosting
- Light and dark color schemes, both defined as design tokens

## Getting started

You need Node 22 and a Supabase project.

1. Install dependencies.

   ```
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the values.

   | Variable | Where it comes from |
   |----------|---------------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase project settings, API keys |
   | `NEXT_PUBLIC_SITE_URL` | The address the short links are built from, for example `https://c-links.vercel.app` |
   | `SUPABASE_SECRET_KEY` | Supabase project settings, API keys, secret keys. Starts with `sb_secret_`. Server only, never expose it to the browser. |

3. Set up the database. Run the file in `supabase/migrations` in the Supabase SQL Editor. Migrations are run by hand and never pushed automatically.

4. In the Supabase dashboard, turn off public sign-ups under Authentication settings. Every signed-in user is treated as a partner.

5. Create the first partner account in the Supabase dashboard (Authentication, Users). After that, partners can add each other from the Partners page.

6. Start the app.

   ```
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
| `npm run design` | Run the design gate, which checks the mechanical rules of `docs/ux-ui-guidelines.md` |

## Project structure

```
app/
  login/               partner sign-in
  (admin)/             header, navigation, Cards and Partners pages
  c/[code]/route.ts    public short link: counts the tap, redirects
  api/partners/        protected route that creates partner accounts
components/            shared UI pieces
lib/                   Supabase clients, card and partner data access, Web NFC
theme/                 design tokens and the Mantine theme built from them
public/                logo and login artwork
supabase/migrations/   database schema
proxy.ts               keeps the session fresh, sends signed-out visitors to /login
```

## Checks

GitHub Actions runs on every pull request and every push to `main`: lint, type check, build, the design gate, a SonarQube scan, a Gitleaks secret scan, and a migration lint against a throwaway local database. Vercel builds and deploys from GitHub on push. The workflow itself never deploys.

## Project docs

The `docs/` folder holds the decisions and rules the project is built within.

| File | Purpose |
|------|---------|
| `docs/project-brief.md` | What is being built and what done looks like |
| `docs/architecture-notes.md` | Tech stack, folder structure, and how files connect |
| `docs/constraints.md` | Rules an AI assistant must never break |
| `docs/decision-log.md` | Major decisions and the reasons behind them |
| `docs/open-questions.md` | Questions that needed a human answer, and their answers |
| `docs/ux-ui-guidelines.md` | Rules that govern every UI decision |
| `docs/ci-cd.md` | Automated checks and deployment |

## License

MIT
