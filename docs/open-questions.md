# open-questions.md

---
## AI RULES — READ FULLY BEFORE ANY ACTION
---

1. Read this file at the start of every session and at every
   major milestone.
2. Section 1 questions are hard blockers. Do not write any code
   or make any structural decision until all Section 1 questions
   are answered by the human.
3. Section 2 questions are active blockers. Do not pass the
   milestone they are tagged to without resolving them first.
4. When uncertain mid-build → do not guess. First run the CHECK
   BEFORE ASKING below. Only if the answer is truly not found, add a
   question to Section 2 with its milestone tag, flag it to the human,
   and wait for an answer before continuing.
5. When a question is answered → move it to the Resolved log
   at the bottom. Never delete questions — resolved ones become
   part of the project's decision history.
6. Never answer your own questions with assumptions. If a question
   is here, it means a human decision is required.
7. Keep it tight. One question per row, one or two sentences. No
   background, no explaining what other files already say.

---
## SECTION 1 — BEFORE STARTING
---
These must all be answered before any code is written.
If any are blank → stop and ask.

| # | Question | Answer |
|---|----------|--------|
| 1 | All answered. See Resolved questions. | |

---
## SECTION 2 — ACTIVE DURING BUILD
---
Questions that surfaced mid-project.
Each question is tagged to the milestone where it must be resolved.

| # | Question | Milestone | Answered? |
|---|----------|-----------|-----------|
| 9 | What will the Vercel project URL be? The short link is built from it and gets written onto cards. | Before the first card is written | [ ] |

---
## CHECK BEFORE ASKING
---

Before adding any question, confirm the answer is not already known.
Read thoroughly, do not skim:

1. Re-read project-brief.md, architecture-notes.md, constraints.md,
   and decision-log.md in full.
2. Read every question in this file, including Resolved. If the same
   question, or one with the same answer, exists → do not add it.
3. Check the existing code and files for the answer.
4. If the answer is found anywhere above → use it. Do not ask. Ask
   only if it is missing AND needs a human decision.

---
## HOW TO ADD A QUESTION (AI instructions)
---

When you hit uncertainty mid-build:
1. Stop what you are doing and run CHECK BEFORE ASKING
2. Write the question clearly and specifically —
   not "what should I do here?" but "should the user
   profile data be fetched on login or on page load,
   given that X and Y are both affected by this choice?"
3. Tag it to the nearest upcoming milestone
4. Tell the human: "I've added a question to open-questions.md
   before I can continue. See question #[N]."
5. Wait for the answer before proceeding

---
## RESOLVED QUESTIONS
---
Answered questions live here permanently as part of project history.

| # | Question | Answer | Resolved At |
|---|----------|--------|-------------|
| 1 | Which framework? | Next.js (App Router), decision-log #2 | Project start |
| 2 | Card model? | The chip stores a short link redirected by the app to the customer's URL, with tap counts, decision-log #3 | Project start |
| 3 | Short-link domain? | Free *.vercel.app address, decision-log #4 | Project start |
| 5 | Palette and icon library? | Radix Slate with Indigo accent (blueish), light and dark values from Radix Colors 3.0.0. Tabler Icons. | Before UI build |
| 6 | Which font pair? | Source Serif 4 headings and Source Sans 3 body, weights 400 and 600 only | Before UI build |
| 7 | How do partners sign in? | Email and password through Supabase Auth | Auth build |
| 4 | Which CI platform, and is SonarQube hosted or self-hosted? | GitHub Actions, with SonarQube Cloud (hosted), decision-log #5 | CI setup |
| 8 | Dark and light mode behavior? | Follows the device setting automatically, with one override in the profile menu (Light, Dark, System) | Schema milestone |

---
