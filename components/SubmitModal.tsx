"use client";

import { useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { Modal, inputCls, labelCls, btnPrimary, btnSecondary } from "./ui";

/** Marking a task submitted — the candidate attaches their submission link. */
export function SubmitModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const store = useStore();
  const [url, setUrl] = useState(task.submissionUrl);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await store.updateTask(task.id, {
      status: "submitted",
      submissionUrl: url.trim(),
    });
    onClose();
  };

  return (
    <Modal title={`Submit: ${task.title}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Submission link (optional)</label>
          <input
            type="url"
            className={inputCls}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/…"
            autoFocus
          />
          <p className="mt-1 text-xs text-slate-500">
            Where the reviewer can find your work — a repo, sandbox, or document.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={btnPrimary}>
            Mark submitted
          </button>
        </div>
      </form>
    </Modal>
  );
}
