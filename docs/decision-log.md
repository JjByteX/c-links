# decision-log.md

---
## AI RULES — READ FULLY BEFORE ANY ACTION
---

1. Read all existing entries before suggesting anything already decided.
2. Never re-debate a logged decision. If it needs revisiting → flag it,
   don't silently override it.
3. At every major milestone → check whether a decision qualifies
   under rule 4. If it does, add an entry.
4. Log only truly major decisions. Apply this filter — a decision must
   pass ALL three, otherwise do not log it:
   - Hard to reverse?
   - Affects multiple parts of the system?
   - Confusing without an explanation?
   Never log: naming, styling, small library choices, bug fixes,
   refactors, or anything easily changed later.
   When unsure → do not log.
5. Before presenting options at a milestone → search current community
   consensus on each direction. Present findings, then wait for human
   decision before logging.
6. If two directions were discussed with the human → both get logged,
   with the reason the chosen path was taken.
7. Keep every entry tight. Maximum 2 sentences per field. No
   background stories, no repeating context from other files.

---
## DECISION ENTRIES
---

### Entry Format — copy this block for each new decision

**#:** 1
**Date:** 2026-10-22
**Milestone:** Project start — platform

**Context:**
The project needed a platform before any structure was proposed.

**Options Considered:**
- Option A: Web app (Mantine, Vercel, Supabase).
- Option B: Mobile app.

**Community Consensus:**
Web NFC is supported only in Chrome on Android, and Safari on iOS has no Web NFC support. This affects chip writing only, not tapping, so a web app can still be used and the link opened on any NFC phone.

**Decision:**
Web app. It matches the chosen tools (Mantine, Vercel, Supabase), and the chip write stays in an external NFC writing app.

**Consequences:**
Chips are not written from the app. A mobile app would need a separate build and could not use Mantine.

---

**#:** 2
**Date:** 2026-10-22
**Milestone:** Project start — framework

**Context:**
The redirect needs a server-side step on Vercel, and Mantine works with more than one framework.

**Options Considered:**
- Option A: Next.js (App Router).
- Option B: Vite + React with a separate Vercel serverless function.

**Community Consensus:**
Mantine's own getting-started page lists templates for both Next.js and Vite, including a Vite + Supabase + Mantine one. Neither is discouraged.

**Decision:**
Next.js (App Router), because the redirect and tap log fit in one route handler with no extra wiring.

**Consequences:**
Mantine needs the App Router setup (provider in the root layout, client components). Versions are confirmed at project setup.

---

**#:** 3
**Date:** 2026-10-22
**Milestone:** Project start — card model

**Context:**
The customer supplies the destination URL (Facebook, Instagram, website), and the chip has to hold something.

**Options Considered:**
- Option A: The chip stores the customer's URL directly.
- Option B: The chip stores a C-Links short link that the app redirects to the customer's URL.

**Community Consensus:**
Not searched. This is a project-specific choice tied to the business plan.

**Decision:**
Option B. It allows changing a destination without rewriting the chip and allows tap counts.

**Consequences:**
Cards stop working if the app is down. Every card write depends on the short-link domain.

---

**#:** 4
**Date:** 2026-10-22
**Milestone:** Project start — short-link domain

**Context:**
The short link is written onto physical cards, so changing the domain later means rewriting them.

**Options Considered:**
- Option A: Free *.vercel.app address.
- Option B: Custom domain.

**Community Consensus:**
Not searched. This is a project-specific choice.

**Decision:**
Free *.vercel.app address, because this is a school project.

**Consequences:**
Cards written now depend on that project name. Moving to a custom domain later means rewriting those cards.

---

**#:** 5
**Date:** 2026-10-22
**Milestone:** CI setup — platform

**Context:**
ci-cd.md calls for lint and SonarQube on every change, and the code is on GitHub.

**Options Considered:**
- Option A: GitHub Actions with SonarQube Cloud (hosted).
- Option B: Self-hosted SonarQube.

**Community Consensus:**
SonarQube Cloud's pricing page says analysis of public projects is free. Self-hosting means running and updating a server.

**Decision:**
Option A, with the same checks as lakbay-pasig minus the production migration push, because the repo is public and the project is small.

**Consequences:**
Checks need a SONAR_TOKEN secret and the SonarQube Cloud project set up. Migrations stay manual until a separate decision says otherwise.

---

### Entry Format (blank) — copy this block for each new decision

**#:**
**Date:**
**Milestone:** (e.g. "Project start", "30% — authentication approach")

**Context:**
What situation or problem forced this decision?

**Options Considered:**
- Option A:
- Option B:

**Community Consensus:**
What do experienced developers say about each option today?
(AI: search this before the milestone conversation — do not fill from memory alone)

**Decision:**
What was chosen and why?

**Consequences:**
What does this decision affect going forward?
What becomes harder or easier because of this choice?

---
