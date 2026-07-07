"use client";

import type { ResourceLink } from "@/lib/types";
import { inputCls, labelCls } from "./ui";

/** Repeatable label+URL rows for assignment resources. */
export function LinksEditor({
  links,
  onChange,
}: {
  links: ResourceLink[];
  onChange: (links: ResourceLink[]) => void;
}) {
  const setRow = (i: number, patch: Partial<ResourceLink>) =>
    onChange(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  return (
    <div>
      <label className={labelCls}>Resource links (optional)</label>
      <div className="space-y-2">
        {links.map((link, i) => (
          <div key={i} className="flex gap-2">
            <input
              className={`${inputCls} w-2/5`}
              placeholder="Label, e.g. Spec doc"
              value={link.label}
              onChange={(e) => setRow(i, { label: e.target.value })}
            />
            <input
              type="url"
              className={inputCls}
              placeholder="https://…"
              value={link.url}
              onChange={(e) => setRow(i, { url: e.target.value })}
            />
            <button
              type="button"
              onClick={() => onChange(links.filter((_, idx) => idx !== i))}
              className="rounded px-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              title="Remove link"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...links, { label: "", url: "" }])}
        className="mt-2 text-sm font-medium text-indigo-600 hover:underline"
      >
        + Add link
      </button>
    </div>
  );
}

/** Drop incomplete rows before saving. */
export function cleanLinks(links: ResourceLink[]): ResourceLink[] {
  return links
    .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
    .filter((l) => l.url !== "");
}
