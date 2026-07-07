"use client";

import { useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import { VERDICT_LABELS, type Task, type Verdict } from "@/lib/types";
import {
  Modal,
  SubmissionLink,
  EvaluationBox,
  inputCls,
  labelCls,
  btnPrimary,
  btnSecondary,
} from "./ui";

/** Finishing a review: record the verdict + feedback, task becomes Done. */
export function ReviewModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const store = useStore();
  const [verdict, setVerdict] = useState<Verdict | null>(task.review?.verdict ?? null);
  const [notes, setNotes] = useState(task.review?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!verdict) return;
    setSaving(true);
    await store.updateTask(task.id, {
      status: "done",
      review: { verdict, notes: notes.trim(), reviewedAt: Date.now() },
    });
    onClose();
  };

  const verdictStyles: Record<Verdict, string> = {
    pass: "peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600",
    borderline: "peer-checked:bg-amber-500 peer-checked:text-white peer-checked:border-amber-500",
    fail: "peer-checked:bg-red-600 peer-checked:text-white peer-checked:border-red-600",
  };

  return (
    <Modal title={`Review: ${task.title}`} onClose={onClose}>
      {(task.submissionUrl || task.evaluation) && (
        <div className="mb-4 space-y-3 text-sm">
          {task.submissionUrl && <SubmissionLink url={task.submissionUrl} />}
          {task.evaluation && <EvaluationBox text={task.evaluation} />}
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Verdict</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(VERDICT_LABELS) as Verdict[]).map((v) => (
              <label key={v} className="cursor-pointer">
                <input
                  type="radio"
                  name="verdict"
                  value={v}
                  checked={verdict === v}
                  onChange={() => setVerdict(v)}
                  className="peer sr-only"
                />
                <span
                  className={`block rounded-lg border border-slate-300 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 ${verdictStyles[v]}`}
                >
                  {VERDICT_LABELS[v]}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Feedback notes</label>
          <textarea
            className={inputCls}
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Strengths, weaknesses, recommendation…"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={saving || !verdict} className={btnPrimary}>
            Finish review
          </button>
        </div>
      </form>
    </Modal>
  );
}
