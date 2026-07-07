"use client";

import { useStore } from "@/lib/store";
import { canManage, isOverdue, type Task } from "@/lib/types";
import { Modal, StatusBadge, VerdictBadge, SubmissionLink, EvaluationBox } from "./ui";

/**
 * Read-only task view. Role-scoped: instructions + resource links are for
 * everyone, evaluation criteria only for the reviewer and the admin.
 */
export function TaskDetailsModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const store = useStore();
  const me = store.currentUser!;
  const candidate = store.users.find((u) => u.id === task.candidateId);
  const interviewer = store.users.find((u) => u.id === task.interviewerId);
  const seesEvaluation = canManage(me) || me.id === task.interviewerId;

  return (
    <Modal title={task.title} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-slate-600">
          <span>
            <b>Position:</b> {task.position}
          </span>
          <span>
            <b>Candidate:</b> {candidate?.name ?? "—"}
          </span>
          <span>
            <b>Reviewer:</b> {interviewer?.name ?? "—"}
          </span>
          <StatusBadge status={task.status} />
        </div>
        {task.dueDate && (
          <p className={isOverdue(task) ? "font-semibold text-red-600" : "text-slate-600"}>
            <b>Due:</b>{" "}
            {new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {isOverdue(task) && " — overdue"}
          </p>
        )}
        {task.instructions && (
          <div>
            <h3 className="mb-1 font-semibold text-slate-900">Instructions</h3>
            <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-700">
              {task.instructions}
            </p>
          </div>
        )}
        {task.links.length > 0 && (
          <div>
            <h3 className="mb-1 font-semibold text-slate-900">Resources</h3>
            <ul className="list-inside list-disc space-y-1">
              {task.links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 underline"
                  >
                    {link.label || link.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {seesEvaluation && task.evaluation && (
          <EvaluationBox text={task.evaluation} note="not visible to the candidate" />
        )}
        {task.submissionUrl && <SubmissionLink url={task.submissionUrl} />}
        {task.review && (
          <div className="flex items-start gap-2">
            <VerdictBadge verdict={task.review.verdict} />
            {task.review.notes && (
              <p className="whitespace-pre-wrap text-slate-700">{task.review.notes}</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
