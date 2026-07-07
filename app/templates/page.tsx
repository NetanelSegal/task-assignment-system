"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { seedTemplates } from "@/lib/seed";
import { canManage, type Template } from "@/lib/types";
import { TemplateModal } from "@/components/TemplateModal";
import { TaskModal } from "@/components/TaskModal";
import { btnPrimary, btnSecondary, btnDanger } from "@/components/ui";

/** Managers (admin + semi-admin): the reusable home-assignment library. */
export default function TemplatesPage() {
  const store = useStore();
  const me = store.currentUser!;
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [assigning, setAssigning] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!canManage(me)) {
    return (
      <p className="py-16 text-center text-slate-500">
        Only admins and semi-admins can manage assignment templates.
      </p>
    );
  }

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const loadHumiTemplates = async () => {
    setLoading(true);
    await run(() => seedTemplates(store));
    setLoading(false);
  };

  const sorted = [...store.templates].sort(
    (a, b) => a.position.localeCompare(b.position) || a.name.localeCompare(b.name)
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Assignment templates</h1>
          <p className="mt-1 text-sm text-slate-500">
            Reusable home assignments per position — assign one to a candidate in two
            clicks. Tasks get a snapshot, so editing a template never changes tasks
            already sent.
          </p>
        </div>
        <div className="flex gap-2">
          {store.templates.length === 0 && (
            <button className={btnSecondary} disabled={loading} onClick={loadHumiTemplates}>
              {loading ? "Loading…" : "✨ Load HUMI templates"}
            </button>
          )}
          <button className={btnPrimary} onClick={() => setCreating(true)}>
            + New template
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {sorted.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
          No templates yet. Load the ready-made HUMI set or create your own.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((template) => (
          <div
            key={template.id}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-slate-900">{template.name}</h2>
                <p className="text-sm text-slate-500">{template.position}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {template.dueInDays} day{template.dueInDays === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-3 line-clamp-3 flex-1 whitespace-pre-line text-sm text-slate-600">
              {template.instructions}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                onClick={() => setAssigning(template)}
              >
                Assign to candidate…
              </button>
              <span className="flex gap-2">
                <button
                  className="text-xs font-medium text-slate-500 hover:text-indigo-600"
                  onClick={() => setEditing(template)}
                >
                  Edit
                </button>
                <button
                  className={btnDanger}
                  onClick={() => {
                    if (confirm(`Delete template "${template.name}"?`))
                      run(() => store.deleteTemplate(template.id));
                  }}
                >
                  Delete
                </button>
              </span>
            </div>
          </div>
        ))}
      </div>

      {creating && <TemplateModal onClose={() => setCreating(false)} />}
      {editing && <TemplateModal template={editing} onClose={() => setEditing(null)} />}
      {assigning && (
        <TaskModal fromTemplate={assigning} onClose={() => setAssigning(null)} />
      )}
    </div>
  );
}
