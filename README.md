# Interview Task & Review Tracker

Track interview tasks from **assigned** to **reviewed**: a candidate (interviewee) gets a task,
an interviewer reviews the submission, and the verdict + feedback are recorded — all visible in
one table.

**🔗 Live demo: [humi-home-assignment.vercel.app](https://humi-home-assignment.vercel.app)** —
sign in with a [demo login](#try-it--demo-logins) below (no setup needed).

> Product thinking (problem, scope decisions, data model, flow) is in **[PRD.md](./PRD.md)**.

## Try it — demo logins

The app is pre-loaded with a demo dataset. Log in with any of these (all share the password
**`demo1234`**) to see each role's view:

| Role | Email | Password | What you'll see |
|---|---|---|---|
| **Admin** | `admin@humi-demo.com` | `demo1234` | Everything: all tasks, Templates, and full People management (change roles, remove people) |
| **Semi-admin** | `semiadmin@humi-demo.com` | `demo1234` | All tasks + full Templates; People page is **read-only** (no role changes / removals) |
| **Interviewer** | `interviewer@humi-demo.com` | `demo1234` | "Tasks I review" — one ready to **Start review**, one to **Finish review** |
| **Candidate** | `candidate@humi-demo.com` | `demo1234` | "My tasks" — assignments to **Mark submitted**, with instructions & resource links |

Tip: open the admin in one browser and the candidate in an incognito window — submit a task as
the candidate and watch it update live for the admin. To re-create these accounts and tasks from
scratch, run `npm run seed:demo` (see [scripts/seed-demo.ts](./scripts/seed-demo.ts)).

## The workflow

```
Assigned ──► Submitted ──► Under Review ──► Done (Pass / Borderline / Fail + notes)
```

- **Register / login** (Firebase Auth) — sign up as a **candidate** or an **interviewer**.
  There is one fixed **admin** (identified by email, not a grantable role); the admin can
  promote people to **semi-admin**.
- **Four roles** — *admin* (everything), *semi-admin* (manages tasks & templates, People is
  read-only), *interviewer* (reviews their tasks), *candidate* (their own tasks).
- **Role-scoped tasks page** — admin & semi-admin see all tasks; interviewers see the tasks
  they review; candidates see their own. Each row shows the one next action the signed-in
  user may take: candidates mark submitted (+ attach a link), interviewers record the verdict.
- **People page** — everyone who registered. The admin can change roles and remove people;
  semi-admins see it read-only.
- **Templates page (managers)** — a CRUD library of reusable home assignments (instructions,
  resource links, reviewer-only evaluation criteria, default deadline). One-click load of
  ready-made templates for HUMI Group's real business lines; assign to a candidate in two
  clicks or pick a template inside New Task.
- **Real-time** — open two browsers as two users, watch changes sync live (Firestore listeners).

## Setup

The app needs a Firebase project:

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com) →
   add a **Web app** → copy the config.
2. Create a **Cloud Firestore** database (production mode).
3. Enable **Authentication → Sign-in method → Email/Password**.
4. Copy `.env.local.example` to `.env.local` and paste your values.
5. Deploy the security rules ([firestore.rules](./firestore.rules), versioned in this repo):

   ```bash
   npx firebase-tools login   # once
   npm run deploy:rules
   ```

   The rules require authentication for everything, restrict task & template management to
   managers (admin + semi-admin), and lock role changes / user removal to the admin — the
   server-side mirror of the app's role model.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with a [demo login](#try-it--demo-logins) above — or
**register** a fresh account (new accounts join as a candidate or interviewer).

To (re)provision the demo accounts and tasks against your Firebase project:

```bash
npm run seed:demo
```

## Stack & architecture

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4** — frontend-only,
  no API layer.
- **Firebase**: Firestore (collections `users`, `tasks`, `templates`, real-time via
  `onSnapshot`) + Firebase Auth (email/password); the user profile doc id equals the auth uid.
- Role-based views (admin / semi-admin / interviewer / candidate) enforced client-side **and**
  in [firestore.rules](./firestore.rules). Admin is a fixed **email allowlist**
  (`ADMIN_EMAILS` in [lib/types.ts](./lib/types.ts), mirrored in the rules) — not a grantable
  role — so no account can self-assign management access; role changes and user removal are
  admin-only.

## Project structure

```
app/page.tsx           the role-scoped task table (the whole workflow)
app/templates/page.tsx assignment template library (managers)
app/people/page.tsx    people directory (admin manages roles/removal; semi-admin read-only)
app/login, app/register  auth pages
components/            auth gate, task/review/submit/template modals, nav, UI primitives
lib/types.ts           domain model + lifecycle + template→task helpers
lib/firebase.ts        Firebase initialization
lib/store.tsx          React context: Firestore data + auth session + actions
lib/humi-templates.ts  ready-made HUMI assignment presets
lib/seed.ts            demo-data + template seeding
scripts/seed-demo.ts   provisions the demo login accounts (npm run seed:demo)
firestore.rules        security rules (deploy: npm run deploy:rules)
PRD.md                 product requirements & scope decisions
```
