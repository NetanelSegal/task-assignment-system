"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ROLE_LABELS, canManage, isAdmin, roleLabel, type Role } from "@/lib/types";
import { inputCls, btnDanger } from "@/components/ui";

/**
 * People directory. Managers (admin + semi-admin) can view it; only the admin
 * can change roles and remove people — for a semi-admin it's read-only.
 */
export default function PeoplePage() {
  const store = useStore();
  const me = store.currentUser!;
  const [error, setError] = useState("");

  if (!canManage(me)) {
    return (
      <p className="py-16 text-center text-slate-500">
        Only admins and semi-admins can view people.
      </p>
    );
  }

  const admin = isAdmin(me); // full control; semi-admins get a read-only view

  const run = async (action: () => Promise<unknown>, onFail?: () => void) => {
    try {
      await action();
      setError("");
    } catch (err) {
      onFail?.();
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const sorted = [...store.users].sort(
    (a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name)
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">People</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">
        {admin
          ? "Everyone with an account or profile. Change roles or remove people here."
          : "Everyone with an account or profile. View only — role and user management is admin-only."}
      </p>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {sorted.map((user, idx) => {
          const asCandidate = store.tasks.filter((t) => t.candidateId === user.id).length;
          const asReviewer = store.tasks.filter((t) => t.interviewerId === user.id).length;
          const isSelf = user.id === me.id;
          const isOwner = isAdmin(user); // an allowlist admin — role can't be changed here
          return (
            <div
              key={user.id}
              className={`flex flex-wrap items-center gap-4 p-4 ${
                idx > 0 ? "border-t border-slate-100" : ""
              }`}
            >
              <div className="min-w-44 flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {user.name}
                  {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                </p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <span className="w-36 text-xs text-slate-400">
                {isOwner
                  ? "manages everything"
                  : user.role === "candidate"
                    ? `${asCandidate} task${asCandidate === 1 ? "" : "s"}`
                    : user.role === "interviewer"
                      ? `${asReviewer} review${asReviewer === 1 ? "" : "s"}`
                      : "manages tasks"}
              </span>
              {isOwner ? (
                <span className="w-40 rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-medium text-slate-600">
                  {roleLabel(user)}
                </span>
              ) : (
                <select
                  className={`${inputCls} w-40`}
                  value={user.role}
                  disabled={!admin}
                  title={admin ? "Change role" : "Admin only"}
                  onChange={(e) => {
                    const prev = user.role;
                    const next = e.target.value as Role;
                    run(
                      () => store.updateUserRole(user.id, next),
                      () => {
                        e.target.value = prev; // controlled value didn't change; resync DOM
                      }
                    );
                  }}
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
              {admin && (
                <button
                  className={`${btnDanger} disabled:opacity-40`}
                  disabled={isSelf || isOwner}
                  title={
                    isSelf
                      ? "You can't remove yourself"
                      : isOwner
                        ? "The admin account can't be removed"
                        : "Remove this person"
                  }
                  onClick={() => {
                    if (
                      confirm(
                        `Remove ${user.name}? Their profile and app access are deleted (their login isn't).`
                      )
                    )
                      run(() => store.deleteUser(user.id));
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-400">Nobody here yet.</p>
        )}
      </div>
    </div>
  );
}
