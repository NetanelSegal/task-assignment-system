"use client";

import { useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import type { Template } from "@/lib/types";
import { LinksEditor, cleanLinks } from "./LinksEditor";
import { Modal, inputCls, labelCls, btnPrimary, btnSecondary } from "./ui";

export function TemplateModal({
  template,
  onClose,
}: {
  template?: Template; // present = edit mode
  onClose: () => void;
}) {
  const store = useStore();
  const [name, setName] = useState(template?.name ?? "");
  const [position, setPosition] = useState(template?.position ?? "");
  const [dueInDays, setDueInDays] = useState(template?.dueInDays ?? 5);
  const [links, setLinks] = useState(template?.links ?? []);
  const [instructions, setInstructions] = useState(template?.instructions ?? "");
  const [evaluation, setEvaluation] = useState(template?.evaluation ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      name: name.trim(),
      position: position.trim(),
      dueInDays: Math.max(1, dueInDays),
      links: cleanLinks(links),
      instructions,
      evaluation,
    };
    if (template) await store.updateTemplate(template.id, data);
    else await store.addTemplate(data);
    onClose();
  };

  return (
    <Modal title={template ? "Edit template" : "New template"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Template name</label>
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder="e.g. Apartment booking feature"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div>
            <label className={labelCls}>Days to deadline</label>
            <input
              type="number"
              min={1}
              max={60}
              className={inputCls}
              value={dueInDays}
              onChange={(e) => setDueInDays(Number(e.target.value))}
            />
          </div>
        </div>
        <LinksEditor links={links} onChange={setLinks} />
        <div>
          <label className={labelCls}>Instructions (the candidate sees this)</label>
          <textarea
            className={inputCls}
            rows={7}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            required
            placeholder="What to build/do, deliverables, constraints…"
          />
        </div>
        <div>
          <label className={labelCls}>Evaluation criteria (reviewer only)</label>
          <textarea
            className={inputCls}
            rows={4}
            value={evaluation}
            onChange={(e) => setEvaluation(e.target.value)}
            placeholder="What a great submission looks like — hidden from the candidate"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim() || !position.trim()}
            className={btnPrimary}
          >
            {template ? "Save" : "Create template"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
