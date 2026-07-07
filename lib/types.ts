export type TaskStatus = "assigned" | "submitted" | "under_review" | "done";
export type Verdict = "pass" | "borderline" | "fail";
/** Stored roles. "admin" is NOT a stored role — it's decided by email (ADMIN_EMAILS). */
export type Role = "candidate" | "interviewer" | "semi_admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: number;
}

export const ROLE_LABELS: Record<Role, string> = {
  candidate: "Candidate",
  interviewer: "Interviewer",
  semi_admin: "Semi-admin",
};

/** Roles a person can pick at registration (never a management role). */
export const SELF_ROLES: Role[] = ["candidate", "interviewer"];

/**
 * The single source of truth for who is the admin. Admin is an identity, not a
 * grantable role: the same list is mirrored in firestore.rules (which can't
 * import code). Keep them in sync.
 */
export const ADMIN_EMAILS = ["admin@humi-demo.com"];

/** The one immutable owner-admin (by email). */
export function isAdmin(user: User | null | undefined): boolean {
  return !!user && ADMIN_EMAILS.includes(user.email.toLowerCase());
}

/** Admin or semi-admin — may manage tasks and templates. */
export function canManage(user: User | null | undefined): boolean {
  return isAdmin(user) || user?.role === "semi_admin";
}

/** Display label, showing allowlist accounts as "Admin" regardless of stored role. */
export function roleLabel(user: User): string {
  return isAdmin(user) ? "Admin" : ROLE_LABELS[user.role];
}

export interface Review {
  verdict: Verdict;
  notes: string;
  reviewedAt: number;
}

/** A labeled resource attached to an assignment (spec doc, starter repo, staging env…). */
export interface ResourceLink {
  label: string;
  url: string;
}

export interface Task {
  id: string;
  title: string;
  position: string; // free-text label, e.g. "Frontend Engineer"
  candidateId: string;
  interviewerId: string;
  dueDate: string | null; // ISO date (yyyy-mm-dd)
  instructions: string; // candidate-visible brief
  links: ResourceLink[]; // candidate-visible resources
  evaluation: string; // reviewer-visible criteria — hidden from the candidate
  submissionUrl: string;
  status: TaskStatus;
  review: Review | null; // set when status becomes "done"
  createdAt: number;
}

/** A reusable home-assignment definition; creating a task from it copies a snapshot. */
export interface Template {
  id: string;
  name: string;
  position: string;
  instructions: string;
  links: ResourceLink[];
  evaluation: string;
  dueInDays: number;
  createdAt: number;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  assigned: "Assigned",
  submitted: "Submitted",
  under_review: "Under Review",
  done: "Done",
};

/** The linear lifecycle: each status's next step (done is terminal). */
export const NEXT_STATUS: Partial<Record<TaskStatus, TaskStatus>> = {
  assigned: "submitted",
  submitted: "under_review",
  under_review: "done",
};

export const NEXT_ACTION_LABELS: Partial<Record<TaskStatus, string>> = {
  assigned: "Mark submitted",
  submitted: "Start review",
  under_review: "Finish review…",
};

export const VERDICT_LABELS: Record<Verdict, string> = {
  pass: "Pass",
  borderline: "Borderline",
  fail: "Fail",
};

/** ISO date (yyyy-mm-dd) `days` from today — used for template due dates. */
export function dateInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The task fields copied when a task is created from a template.
 * Single source of truth so seeded tasks and "Assign to candidate…" stay in sync.
 */
export function taskFieldsFromTemplate(t: Omit<Template, "id" | "createdAt"> | Template) {
  return {
    title: t.name,
    position: t.position,
    instructions: t.instructions,
    links: t.links,
    evaluation: t.evaluation,
    dueDate: dateInDays(t.dueInDays),
  };
}

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.dueDate + "T00:00:00") < today;
}
