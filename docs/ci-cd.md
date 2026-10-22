# ci-cd.md

> Optional. Fill this in only if the project needs automated checks or deployment.

---
## AI RULES — READ FULLY BEFORE ANY ACTION
---

1. If "Needed" below is No → do nothing. If it is blank → ask the human.
   Never set up a pipeline on your own.
2. Read this entire file and architecture-notes.md before creating or
   changing any pipeline.
3. Match the project scale. Do not add steps, tools, or environments
   the project does not need.
4. Never touch secrets, credentials, or production config without
   human approval. Never put secrets in the repo.
5. Never deploy to production without human confirmation.
6. Log hard-to-reverse choices (platform, deploy strategy) in
   decision-log.md, following its filter.

---
## WHAT THIS IS
---

**CI (continuous integration):** every change is automatically checked
(lint, tests, build) before it is accepted.

**CD (continuous delivery / deployment):** a change that passes is
automatically shipped to an environment, without manual steps.

**Usually worth it when:** more than one person contributes, the code is
deployed repeatedly, tests exist, or manual deploys cause mistakes.

**Usually not needed when:** it is a solo prototype, there are no tests,
or it is deployed rarely.

---
## PROJECT REFERENCE
---

**Needed:**
[x] Yes   [ ] No   [ ] Later

**Platform:**
GitHub Actions (.github/workflows/ci.yml). SonarQube Cloud (hosted, free for public repos) for analysis.

**Checks on every change:**
(e.g. lint, type check, tests, build)
On every pull request and every push to main: lint, type check, build (placeholder keys), SonarQube scan, Gitleaks secret scan, and a migration lint against a throwaway local database.

**Environments:**
Production only.

**Deploy trigger:**
Vercel builds and deploys from GitHub on push. The workflow does not deploy.

**Deploy target:**
Vercel, with Supabase for the database.

**Where secrets are stored:**
GitHub Actions secrets: SONAR_TOKEN, SUPABASE_ACCESS_TOKEN. Supabase keys for the app live in Vercel environment variables.

**Must never run automatically:**
Production deploys from the workflow, and migrations against the real Supabase project. Migrations are run by hand in the SQL Editor.

**Known fragile steps:**
The migration lint needs Docker on the runner, and the Supabase CLI wants SUPABASE_ACCESS_TOKEN set even though this job never uses it. SonarQube's Automatic Analysis must be off for this project, or it conflicts with the CI scan.

---
