"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";

const PUBLIC_PATHS = ["/login", "/register"];

/** Redirects logged-out visitors to /login and logged-in ones away from it. */
export function AuthGate({ children }: { children: ReactNode }) {
  const store = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [slow, setSlow] = useState(false);

  const isPublic = PUBLIC_PATHS.includes(pathname);
  // a session without a profile doc (account created in the Firebase
  // dashboard) finishes signup on the register page
  const needsProfile = store.ready && store.hasSession && !store.currentUser;
  const shouldRedirectToProfile = needsProfile && pathname !== "/register";
  const shouldRedirectToLogin = store.ready && !store.hasSession && !isPublic;
  const shouldRedirectHome = store.ready && !!store.currentUser && isPublic;

  useEffect(() => {
    if (shouldRedirectToProfile) router.replace("/register");
    else if (shouldRedirectToLogin) router.replace("/login");
    else if (shouldRedirectHome) router.replace("/");
  }, [shouldRedirectToProfile, shouldRedirectToLogin, shouldRedirectHome, router]);

  // if Firebase never answers (e.g. Firestore not set up), don't hang silently
  useEffect(() => {
    if (store.ready) return;
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, [store.ready]);

  if (!store.ready) {
    const trouble = store.connectionError ?? (slow ? "Still connecting…" : null);
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400">Loading…</p>
        {trouble && (
          <div className="mx-auto mt-6 max-w-md rounded-lg bg-red-50 p-4 text-left text-sm text-red-700">
            <p className="font-semibold">Can&apos;t reach Firebase.</p>
            <p className="mt-1">{trouble}</p>
            <p className="mt-2">
              Check the <code>NEXT_PUBLIC_FIREBASE_*</code> values in{" "}
              <code>.env.local</code>, and make sure the Firebase project has a{" "}
              <b>Cloud Firestore database</b>, <b>Authentication → Email/Password</b>{" "}
              enabled, and the security rules deployed (<code>npm run deploy:rules</code>).
            </p>
          </div>
        )}
      </div>
    );
  }
  if (shouldRedirectToProfile || shouldRedirectToLogin || shouldRedirectHome) return null;
  return <>{children}</>;
}
