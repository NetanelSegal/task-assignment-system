"use client";

import { useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import { taskFieldsFromTemplate, type Task, type Template } from "@/lib/types";
import { LinksEditor, cleanLinks } from "./LinksEditor";
import { Modal, inputCls, labelCls, btnPrimary, btnSecondary } from "./ui";

export function TaskModal({
  task,
  fromTemplate,
  onClose,
}: {
  task?: Task; // present = edit mode
  fromTemplate?: Template; // "Assign…" on the Templates page
  onClose: () => void;
}) {
  const store = useStore();
  const tpl = fromTemplate ? taskFieldsFromTemplate(fromTemplate) : undefined;
  const [title, setTitle] = useState(task?.title ?? tpl?.title ?? "");
  const [position, setPosition] = useState(task?.position ?? tpl?.position ?? "");
  const [candidateId, setCandidateId] = useState(task?.candidateId ?? "");
  const [interviewerId, setInterviewerId] = useState(task?.interviewerId ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? tpl?.dueDate ?? "");
  const [links, setLinks] = useState(task?.links ?? tpl?.links ?? []);
  const [instructions, setInstructions] = useState(
    task?.instructions ?? tpl?.instructions ?? ""
  );
  const [evaluation, setEvaluation] = useState(
    task?.evaluation ?? tpl?.evaluation ?? ""
  );
  const [saving, setSaving] = useState(false);

  const candidates = store.users.filter((u) => u.role === "candidate");
  const interviewers = store.users.filter((u) => u.role === "interviewer");
  const missingPeople = candidates.length === 0 || interviewers.length === 0;

  // creating from scratch: offer the template library as a starting point
  const showPicker = !task && !fromTemplate && store.templates.length > 0;

  const applyTemplate = (id: string) => {
    const t = store.templates.find((x) => x.id === id);
    if (!t) return;
    const f = taskFieldsFromTemplate(t);
    setTitle(f.title);
    setPosition(f.position);
    setDueDate(f.dueDate);
    setLinks(f.links);
    setInstructions(f.instructions);
    setEvaluation(f.evaluation);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      title: title.trim(),
      position: position.trim(),
      candidateId,
      interviewerId,
      dueDate: dueDate || null,
      links: cleanLinks(links),
      instructions,
      evaluation,
    };
    if (task) {
      await store.updateTask(task.id, data);
    } else {
      await store.addTask({
        ...data,
        submissionUrl: "",
        status: "assigned",
        review: null,
      });
    }
    onClose();
  };

  return (
    <Modal title={task ? "Edit task" : "New task"} onClose={onClose}>
      {missingPeople && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          You need at least one candidate and one interviewer — people get these roles
          when they register, or you can change roles on the People page.
        </p>
      )}
      {showPicker && (
        <div className="mb-4 rounded-lg bg-indigo-50 p-3">
          <label className="mb-1 block text-sm font-medium text-indigo-900">
            Start from a template
          </label>
          <select
            className={inputCls}
            defaultValue=""
            onChange={(e) => applyTemplate(e.target.value)}
          >
            <option value="">Blank task…</option>
            {store.templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.position}
              </option>
            ))}
          </select>
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Task title</label>
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Apartment booking feature"
          />
        </div>
        <div>
          <label className={labelCls}>Position</label>
          <input
            className={inputCls}
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            required
            placeholder="e.g. Full-Stack Developer"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Candidate (interviewee)</label>
            <select
              className={inputCls}
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              required
            >
              <option value="">Select…</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Reviewer (interviewer)</label>
            <select
              className={inputCls}
              value={interviewerId}
              onChange={(e) => setInterviewerId(e.target.value)}
              required
            >
              <option value="">Select…</option>
              {interviewers.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Due date</label>
          <input
            type="date"
            className={inputCls}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <LinksEditor links={links} onChange={setLinks} />
        <div>
          <label className={labelCls}>Instructions (the candidate sees this)</label>
          <textarea
            className={inputCls}
            rows={5}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="What to build/do, deliverables, constraints…"
          />
        </div>
        <div>
          <label className={labelCls}>Evaluation criteria (reviewer only)</label>
          <textarea
            className={inputCls}
            rows={3}
            value={evaluation}
            onChange={(e) => setEvaluation(e.target.value)}
            placeholder="Hidden from the candidate"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim() || !candidateId || !interviewerId}
            className={btnPrimary}
          >
            {task ? "Save" : "Create task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
