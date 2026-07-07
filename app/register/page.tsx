"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import { SELF_ROLES, type Role } from "@/lib/types";
import { inputCls, labelCls, btnPrimary } from "@/components/ui";

export default function RegisterPage() {
  const store = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("candidate");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // signed in (e.g. account created in the Firebase dashboard) but no
  // profile yet — only name + role are missing
  const completing = store.hasSession && !store.currentUser;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return; // second click can land before the disabled re-render
    setError("");
    setBusy(true);
    try {
      if (completing) {
        await store.completeProfile(name.trim(), role);
      } else {
        await store.register({ name: name.trim(), email: email.trim(), password, role });
      }
      // AuthGate redirects home once the profile lands
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="text-2xl font-bold">
        {completing ? "Complete your profile" : "Create account"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {completing
          ? "Your account exists — just tell us who you are."
          : "Join as a candidate or an interviewer — an admin can change your role later."}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className={labelCls}>Full name</label>
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        {!completing && (
          <>
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <input
                type="password"
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </>
        )}
        <div>
          <label className={labelCls}>I am a…</label>
          <div className="grid grid-cols-2 gap-2">
            {SELF_ROLES.map((r) => (
              <label key={r} className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                  className="peer sr-only"
                />
                <span className="block rounded-lg border border-slate-300 py-2 text-center text-sm font-medium text-slate-700 capitalize hover:bg-slate-50 peer-checked:border-indigo-600 peer-checked:bg-indigo-600 peer-checked:text-white">
                  {r}
                </span>
              </label>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
          {busy ? "Saving…" : completing ? "Save profile" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        {completing ? (
          <button onClick={store.logout} className="font-medium text-indigo-600 hover:underline">
            Use a different account
          </button>
        ) : (
          <>
            Already registered?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
