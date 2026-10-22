# project-brief.md

---
## AI RULES — READ FULLY BEFORE ANY ACTION
---

1. Read this entire file first. If any section is blank → stop and ask.
2. Automate before building UI. Only surface controls when human judgment is required.
3. Uncertain mid-build → pause, state why, offer two directions, wait for input.
4. All decisions must serve the intent defined below. Flag conflicts, never override silently.
5. Before touching anything → map all connected files and dependencies first.
6. At each major milestone — before, not after — confirm direction with the human before continuing.

---
## PROJECT REFERENCE
---

**Project Name:**
C-Links

**The Problem:**
What exists today that isn't working, is missing, or is frustrating?
Per the business plan, partners program each NFC card by hand, and content updates arrive as Facebook/Instagram messages. Customers should be able to change what a card links to without a new card.

**The Goal:**
What does this project actually solve? One or two sentences max.
A very simple web app for adding and managing the links behind NFC cards, used for business cards and promotional items.

**Who It's For:**
Describe the end user specifically. Not "users" — who exactly?
The five C-Links partners, who sign in and manage cards for customers. Customers do not sign in. Card holders (small business owners, freelancers, event organizers) and the people who tap their cards only ever see the destination page.

**Automation Expectations:**
What should happen automatically without user input?
What genuinely requires human decision or confirmation?
PROPOSED, NOT YET CONFIRMED (open-questions #2): the card holds one permanent short link; the app redirects it to the destination a partner sets. Automatic: link creation, the redirect, tap counts. Human: entering or changing a destination, and the one-time write to the chip using an NFC writing app.

**What Done Looks Like:**
How do you know this is finished? Be concrete, not vague.
All functions work, the UX/UI guidelines are satisfied, the app has both a dark mode and a light mode, and it is deployed on Vercel with Supabase.

**What This Is NOT:**
What is explicitly out of scope? What should the AI never assume
is part of this project?
It is not an online store. It is a school project.

**Open Questions Before Starting:**
Anything unresolved that must be answered before work begins.
See open-questions.md, Section 1.
