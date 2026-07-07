# PRD — Interview Task & Review Tracker

## 1. Background & Problem

A hiring manager works with many interviewers across many open positions. A recurring part of
the process is **interview tasks**: a candidate (interviewee) receives a task — typically a home
assignment or exercise — and an interviewer must **review** the submission and record a verdict.

Today this is tracked ad-hoc (spreadsheets, chat). The documented failure modes:

- Nobody knows which submissions are waiting for review, or with whom.
- Reviews get stuck and overdue tasks are discovered late — time-to-hire grows.
- Verdicts and feedback live in chat threads and get lost.

## 2. Market research (what informed this design)

Greenhouse structures every position as a plan of interview steps with assigned interviewers and
records structured evaluations per step; coordination tools like GoodTime/ModernLoop exist because
distributing review work across interviewers and making its state visible is the real pain.
This app takes the smallest useful slice of that: **one task, one candidate, one reviewer, one
verdict — tracked end to end.**

## 3. Scope decision

Deliberately **one workflow, airtight**: task out → submission in → review done.

**Out of scope** (would be separate product layers): calendar/meeting scheduling, candidate-facing
emails and self-scheduling, interviewer skill/capacity matching, training pipelines, multi-tenancy.

## 4. Users, auth & roles

Users register with email + password and pick a role: **candidate** or **interviewer**.
The **first account becomes admin** automatically; from then on the admin can change anyone's
role (People page) — including promoting another admin.

| Role | Sees | Can do |
|---|---|---|
| **Admin** (hiring manager) | all tasks, all people | create/edit/delete tasks, change roles, everything below |
| **Interviewer** | tasks they review | start review, finish review (verdict + feedback) |
| **Candidate** (interviewee) | their own tasks | mark submitted + attach submission link |

Enforcement is client-side (right-sized for the exercise); in production the same rules would be
mirrored as Firestore security rules.

## 5. Data model

```
User                                Task
----                                ----
id (= auth uid on Firebase)         id
name                                title
email                               position (text label)
role: candidate|interviewer|admin   candidateId  → User (role: candidate)
                                    interviewerId → User (role: interviewer)
                                    dueDate | null
                                    submissionUrl
                                    status: assigned → submitted → under_review → done
                                    review: { verdict: pass|borderline|fail,
                                              notes, reviewedAt } | null
```

The task lifecycle **is** the product:

```
Assigned ──► Submitted ──► Under Review ──► Done (verdict + feedback recorded)
```

## 6. Features

1. **Register / login** — email + password; pick candidate or interviewer at signup; first
   account becomes admin. Session persists; every page is behind the auth gate.
2. **Task table (the app's core)** — every task with candidate, interviewer, due date, status
   badge, and verdict; filter by status (admins also by interviewer), free-text search; overdue
   rows flagged. Each role sees only their slice.
3. **One-click lifecycle** — each row shows exactly one next action *for people allowed to take
   it*: candidate "Mark submitted" (attaches submission link), interviewer "Start review" /
   "Finish review…" (opens the verdict form). Admin can do any step.
4. **Review record** — verdict (Pass / Borderline / Fail) + feedback notes, stored on the task
   and visible in the table; submission link one click away.
5. **Role management (admin)** — People page lists everyone; the admin switches roles via a
   dropdown (self-demotion is blocked so an admin always exists).
6. **Assignment templates (admin)** — a CRUD library of reusable home assignments per
   position: candidate-visible instructions + resource link, reviewer-only evaluation
   criteria, and a default days-to-deadline. Assign from the Templates page or pick a
   template inside New Task; tasks copy a snapshot, so editing a template never mutates
   already-sent tasks. Ships with ready-made templates for HUMI Group's business lines
   (Localz rentals, WL worker housing, Halishka recruitment, HUMI Depot logistics).
7. **Real-time sync** — Firestore listeners; every open tab stays consistent without refresh.

## 7. User flow

1. People **register** as candidates/interviewers; the first account (the hiring manager) is admin.
2. Admin creates a **task**: title, position, candidate, reviewer, due date → *Assigned*.
3. The candidate signs in, sees "My tasks", clicks **Mark submitted** and attaches their link.
4. The interviewer signs in, sees "Tasks I review", clicks **Start review**, then
   **Finish review…** → verdict + feedback → *Done*.
5. The admin's table answers at a glance: what's awaiting review, what's overdue, what passed.

## 8. Architecture

- **Frontend-only**: Next.js (App Router, TypeScript, Tailwind), all client components.
- **Firebase** as backend-as-a-service — **Firestore** (collections `users`, `tasks`,
  real-time via `onSnapshot`) + **Firebase Auth** (email/password); the user profile doc id
  equals the auth uid.
- Config via `.env.local` (`NEXT_PUBLIC_FIREBASE_*`); a clear in-app error explains any
  missing Firebase setup instead of failing silently.

**Why:** one persona, no sensitive data — Firestore removes the entire API/DB layer and keeps all
effort on the workflow itself.

## 9. Success criteria

- Creating and assigning a task takes under 30 seconds.
- "What is waiting for review?" and "what did we decide about candidate X?" answerable in one glance.
- No manual refresh ever needed.
