"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { seedDemoData } from "@/lib/seed";
import {
  NEXT_ACTION_LABELS,
  NEXT_STATUS,
  STATUS_LABELS,
  canManage,
  isOverdue,
  type Task,
  type TaskStatus,
} from "@/lib/types";
import { TaskModal } from "@/components/TaskModal";
import { TaskDetailsModal } from "@/components/TaskDetailsModal";
import { ReviewModal } from "@/components/ReviewModal";
import { SubmitModal } from "@/components/SubmitModal";
import {
  StatusBadge,
  VerdictBadge,
  btnPrimary,
  btnDanger,
  inputCls,
} from "@/components/ui";

export default function TasksPage() {
  const store = useStore();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [viewing, setViewing] = useState<Task | null>(null);
  const [reviewing, setReviewing] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState<Task | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [interviewerFilter, setInterviewerFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const me = store.currentUser!; // AuthGate guarantees a session here
  const manager = canManage(me);

  const userName = (id: string) => store.users.find((u) => u.id === id)?.name ?? "—";

  // each role sees only the tasks that concern them; managers see everything
  const myTasks = useMemo(() => {
    if (manager) return store.tasks;
    if (me.role === "interviewer")
      return store.tasks.filter((t) => t.interviewerId === me.id);
    return store.tasks.filter((t) => t.candidateId === me.id);
  }, [store.tasks, me.id, me.role, manager]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return myTasks
      .filter((t) => statusFilter === "all" || t.status === statusFilter)
      .filter((t) => interviewerFilter === "all" || t.interviewerId === interviewerFilter)
      .filter(
        (t) =>
          !q ||
          [t.title, t.position, userName(t.candidateId), userName(t.interviewerId)]
            .join(" ")
            .toLowerCase()
            .includes(q)
      )
      .sort(
        (a, b) =>
          Number(a.status === "done") - Number(b.status === "done") ||
          (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTasks, store.users, statusFilter, interviewerFilter, search]);

  /** Who may advance a task from its current status. */
  const canAdvance = (task: Task): boolean => {
    if (manager) return true;
    if (task.status === "assigned") return task.candidateId === me.id;
    return task.interviewerId === me.id && me.role === "interviewer";
  };

  const advance = (task: Task) => {
    const next = NEXT_STATUS[task.status];
    if (next === "submitted") setSubmitting(task);
    else if (next === "done") setReviewing(task);
    else if (next) run(() => store.updateTask(task.id, { status: next }));
  };

  if (manager && store.tasks.length === 0 && store.users.length === 1) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-2xl font-bold">Welcome, {me.name} 👋</h1>
        <p className="mt-3 text-slate-600">
          Load a demo dataset to see the workflow, or start by creating tasks for
          candidates as people register.
        </p>
        <button
          className={`${btnPrimary} mt-6`}
          disabled={seeding}
          onClick={async () => {
            setSeeding(true);
            await seedDemoData(store);
            setSeeding(false);
          }}
        >
          {seeding ? "Loading…" : "Load demo data"}
        </button>
      </div>
    );
  }

  const awaitingReview = myTasks.filter(
    (t) => t.status === "submitted" || t.status === "under_review"
  ).length;
  const overdueCount = myTasks.filter(isOverdue).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {manager ? "All tasks" : me.role === "interviewer" ? "Tasks I review" : "My tasks"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {myTasks.length} total · {awaitingReview} awaiting review
            {overdueCount > 0 && (
              <span className="font-semibold text-red-600"> · ⚠ {overdueCount} overdue</span>
            )}
          </p>
        </div>
        {manager && (
          <button className={btnPrimary} onClick={() => setCreating(true)}>
            + New task
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          className={`${inputCls} sm:max-w-60`}
          placeholder="Search task, position, person…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={`${inputCls} sm:max-w-44`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {manager && (
          <select
            className={`${inputCls} sm:max-w-44`}
            value={interviewerFilter}
            onChange={(e) => setInterviewerFilter(e.target.value)}
          >
            <option value="all">All interviewers</option>
            {store.users
              .filter((u) => u.role === "interviewer")
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
          </select>
        )}
      </div>

      {/* the same task list twice: table on md+, cards on small screens */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Interviewer</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Review</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => {
              const overdue = isOverdue(task);
              return (
                <tr key={task.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <TaskTitleButton task={task} manager={manager} onEdit={setEditing} onView={setViewing} />
                    <p className="text-xs text-slate-500">{task.position}</p>
                  </td>
                  <td className="px-4 py-3">{userName(task.candidateId)}</td>
                  <td className="px-4 py-3">{userName(task.interviewerId)}</td>
                  <td className={`px-4 py-3 ${overdue ? "font-semibold text-red-600" : "text-slate-500"}`}>
                    <DueDate task={task} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="max-w-56 px-4 py-3">
                    <ReviewCell task={task} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <TaskActions
                      task={task}
                      manager={manager}
                      canAdvance={canAdvance}
                      advance={advance}
                      onDelete={(t) => run(() => store.deleteTask(t.id))}
                    />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  {myTasks.length === 0 ? "No tasks for you yet." : "No tasks match."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((task) => {
          const overdue = isOverdue(task);
          return (
            <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <TaskTitleButton task={task} manager={manager} onEdit={setEditing} onView={setViewing} />
                  <p className="text-xs text-slate-500">{task.position}</p>
                </div>
                <StatusBadge status={task.status} />
              </div>
              <div className="mt-2 space-y-0.5 text-xs text-slate-600">
                <p>
                  <b>Candidate:</b> {userName(task.candidateId)} · <b>Reviewer:</b>{" "}
                  {userName(task.interviewerId)}
                </p>
                {task.dueDate && (
                  <p className={overdue ? "font-semibold text-red-600" : ""}>
                    <b>Due:</b> <DueDate task={task} />
                  </p>
                )}
              </div>
              <div className="mt-2 text-xs">
                <ReviewCell task={task} />
              </div>
              <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <TaskActions
                  task={task}
                  manager={manager}
                  canAdvance={canAdvance}
                  advance={advance}
                  onDelete={(t) => run(() => store.deleteTask(t.id))}
                />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-400">
            {myTasks.length === 0 ? "No tasks for you yet." : "No tasks match."}
          </p>
        )}
      </div>

      {creating && <TaskModal onClose={() => setCreating(false)} />}
      {editing && <TaskModal task={editing} onClose={() => setEditing(null)} />}
      {viewing && <TaskDetailsModal task={viewing} onClose={() => setViewing(null)} />}
      {reviewing && <ReviewModal task={reviewing} onClose={() => setReviewing(null)} />}
      {submitting && <SubmitModal task={submitting} onClose={() => setSubmitting(null)} />}
    </div>
  );
}

// pieces shared by the desktop table and the mobile cards

function TaskTitleButton({
  task,
  manager,
  onEdit,
  onView,
}: {
  task: Task;
  manager: boolean;
  onEdit: (t: Task) => void;
  onView: (t: Task) => void;
}) {
  return (
    <button
      onClick={() => (manager ? onEdit(task) : onView(task))}
      className="text-left font-medium text-slate-900 hover:text-indigo-600"
      title={manager ? "Edit task" : "View assignment details"}
    >
      {task.title}
    </button>
  );
}

function DueDate({ task }: { task: Task }) {
  if (!task.dueDate) return <>—</>;
  return (
    <>
      {isOverdue(task) && "⚠ "}
      {new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })}
    </>
  );
}

function ReviewCell({ task }: { task: Task }) {
  if (task.review) {
    return (
      <div className="flex items-center gap-2">
        <VerdictBadge verdict={task.review.verdict} />
        {task.review.notes && (
          <span className="truncate text-xs text-slate-500" title={task.review.notes}>
            {task.review.notes}
          </span>
        )}
      </div>
    );
  }
  if (task.submissionUrl) {
    return (
      <a
        href={task.submissionUrl}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-indigo-600 underline"
      >
        submission ↗
      </a>
    );
  }
  return <span className="text-xs text-slate-400">—</span>;
}

function TaskActions({
  task,
  manager,
  canAdvance,
  advance,
  onDelete,
}: {
  task: Task;
  manager: boolean;
  canAdvance: (t: Task) => boolean;
  advance: (t: Task) => void;
  onDelete: (t: Task) => void;
}) {
  return (
    <>
      {NEXT_STATUS[task.status] && canAdvance(task) && (
        <button
          onClick={() => advance(task)}
          className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
        >
          {NEXT_ACTION_LABELS[task.status]}
        </button>
      )}
      {manager && (
        <button
          onClick={() => {
            if (confirm(`Delete task "${task.title}"?`)) onDelete(task);
          }}
          className={`${btnDanger} ml-2`}
          title="Delete task"
        >
          ✕
        </button>
      )}
    </>
  );
}
