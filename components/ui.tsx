"use client";

import type { ReactNode } from "react";
import {
  STATUS_LABELS,
  VERDICT_LABELS,
  type TaskStatus,
  type Verdict,
} from "@/lib/types";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    assigned: "bg-slate-100 text-slate-600",
    submitted: "bg-blue-100 text-blue-700",
    under_review: "bg-amber-100 text-amber-700",
    done: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const styles: Record<Verdict, string> = {
    pass: "bg-emerald-600 text-white",
    borderline: "bg-amber-500 text-white",
    fail: "bg-red-600 text-white",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[verdict]}`}>
      {VERDICT_LABELS[verdict]}
    </span>
  );
}

export function SubmissionLink({ url }: { url: string }) {
  return (
    <p>
      <b>Submission:</b>{" "}
      <a href={url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
        {url}
      </a>
    </p>
  );
}

/** Reviewer-facing criteria — never rendered for candidates. */
export function EvaluationBox({ text, note }: { text: string; note?: string }) {
  return (
    <div>
      <h3 className="mb-1 font-semibold text-slate-900">
        Evaluation criteria{" "}
        {note && <span className="text-xs font-normal text-slate-400">({note})</span>}
      </h3>
      <p className="whitespace-pre-wrap rounded-lg bg-amber-50 p-3 text-slate-700">{text}</p>
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
export const labelCls = "mb-1 block text-sm font-medium text-slate-700";
export const btnPrimary =
  "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50";
export const btnSecondary =
  "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
export const btnDanger =
  "rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50";
