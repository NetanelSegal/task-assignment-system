"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import { inputCls, labelCls, btnPrimary } from "@/components/ui";

export default function LoginPage() {
  const store = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return; // second click can land before the disabled re-render
    setError("");
    setBusy(true);
    try {
      await store.login(email, password);
      // AuthGate redirects home once the session lands
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">
        Track interview tasks from assigned to reviewed.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
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
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        No account?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
