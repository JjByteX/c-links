# architecture-notes.md

---
## AI RULES — READ FULLY BEFORE ANY ACTION
---

1. Read this entire file before proposing any structure, modifying
   any file, or debugging anything.
2. Project scale drives everything. Read the Scale field first.
   Do not propose a structure that exceeds what the scale requires.
3. Before touching any file → identify all files connected to it.
   This map is your reference. If a connection is not listed here,
   find it before proceeding — do not assume it is isolated.
4. Update this file only when the structure changes in a major way:
   a new module or feature, a tech stack change, a moved entry point,
   or a new key dependency. Do not update it for new files, renames,
   or small edits.
5. Never create folders or layers that the current scale does not
   justify. Do not over-architect small projects. Do not under-
   structure large ones.

---
## SCALE — READ THIS FIRST
---

**Project Scale:**
[x] Small — single purpose, few screens, one developer
[ ] Medium — multiple features, growing complexity, needs modularity
[ ] Large — multi-module, many contributors, long-term maintenance

**Scale Guidelines the AI must follow:**

Small → near-flat structure. Minimal subfolders. Group only what
        genuinely needs grouping. No layers for their own sake.

Medium → feature-based grouping. Each feature owns its files.
         Shared utilities in one place. Clear separation of concerns
         without over-engineering.

Large → fully modular. Domain-driven. Each module is independently
        navigable. Explicit dependency boundaries. Documented entry
        points for every major section.

---
## PROJECT REFERENCE
---

**Project Type:**
(e.g. web app, mobile app, desktop tool, API, CLI, etc.)
Web app (decision-log #1). Partners only sign in.

**Tech Stack:**
List each layer with the specific technology and version:
- Frontend: Next.js 16 (App Router), React 19, Mantine 9, TypeScript 5.9, ESLint 9. Fonts: Source Serif 4 and Source Sans 3. Icons: Tabler Icons.
- Backend: Next.js route handlers, hosted on Vercel.
- Database: Supabase.
- Auth: partners only, email and password through Supabase Auth (open-questions #7).
- Other: lint and SonarQube (see ci-cd.md). Light and dark color schemes, both defined as tokens.

**Entry Points:**
What are the main files or modules everything else flows from?
(e.g. main.js, App.tsx, index.py, routes/index.ts)
app/layout.tsx (root layout, fonts, color scheme) and theme/tokens.ts (all design tokens).

**Folder Structure:**
Approved 2026-10-22. Created so far: app/layout.tsx, login, (admin), components/, lib/, proxy.ts, theme/, supabase/migrations/. Not yet created: c/[code].
```
app/
  layout.tsx                  root layout, Mantine provider
  login/page.tsx              partner sign-in
  (admin)/
    layout.tsx                layout shell: header and navigation
    cards/page.tsx            list of cards, add and edit in a modal
  c/[code]/route.ts           public short link: counts the tap, redirects
components/                   shared UI pieces
proxy.ts                      keeps the session fresh, sends signed-out visitors to /login
lib/
  supabase/                   server and browser clients
  cards.ts                    card data access
theme/
  tokens.ts                   light and dark color tokens, shared size tokens
  theme.ts                    Mantine theme built from the tokens
supabase/migrations/          schema
```
AI: if this is empty at project start → propose a structure based
on the Scale field above, explain each folder's purpose, and wait
for human approval before creating anything.

**Module / Feature Map:**
List the main modules or features and what each one is responsible for.
- Sign-in → Responsible for: partner authentication. Customers do not sign in.
- Cards → Responsible for: listing, adding, and editing a card's label and destination URL, and showing its tap count.
- Redirect → Responsible for: the public short link, which counts the tap and sends the visitor to the destination.

**Key Dependencies Between Files:**
Which files depend on which? What breaks if X changes?
(This is the map the AI uses before touching anything)
- c/[code]/route.ts → depends on → the tap_card function in supabase/migrations
- cards/page.tsx → depends on → lib/cards.ts, lib/supabase, and the cards table
- proxy.ts → depends on → lib/supabase/proxy.ts
- every component → depends on → theme/tokens.ts through theme/theme.ts

**What Must Never Be Touched Without Human Approval:**
(e.g. auth logic, payment flows, database schema, config files)
Nothing specified. It is a school project.

**Known Fragile Areas:**
Areas of the codebase that have caused bugs before or require
extra care when modified.

---
## STRUCTURE CHANGE LOG
---
AI: log only major structural changes (rule 4). One sentence per cell.

| Date | Change | Reason |
|------|--------|--------|
| 2026-10-22 | Added proxy.ts and the Supabase packages (@supabase/ssr, @supabase/supabase-js) as key dependencies. | Sign-in needs the session refreshed and protected pages guarded before they render. |

---
