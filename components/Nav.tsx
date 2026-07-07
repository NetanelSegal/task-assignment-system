"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { canManage, roleLabel } from "@/lib/types";

export function Nav() {
  const pathname = usePathname();
  const { currentUser, logout } = useStore();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Tasks" },
    ...(canManage(currentUser)
      ? [
          { href: "/templates", label: "Templates" },
          { href: "/people", label: "People" },
        ]
      : []),
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:gap-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white">
            IT
          </span>
          <span className="hidden sm:inline">Interview Tasks</span>
        </Link>

        {currentUser && (
          <>
            {/* desktop: inline links + user area */}
            <nav className="hidden gap-1 md:flex">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    isActive(href)
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto hidden items-center gap-3 md:flex">
              <span className="text-sm text-slate-600">
                <b className="text-slate-900">{currentUser.name}</b>
                <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {roleLabel(currentUser)}
                </span>
              </span>
              <button
                onClick={logout}
                className="text-sm font-medium text-slate-500 hover:text-indigo-600"
              >
                Sign out
              </button>
            </div>

            {/* mobile: hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="ml-auto rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </>
        )}
      </div>

      {/* mobile menu panel */}
      {currentUser && open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive(href)
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 px-3 pt-3">
            <span className="text-sm text-slate-600">
              <b className="text-slate-900">{currentUser.name}</b>
              <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {roleLabel(currentUser)}
              </span>
            </span>
            <button
              onClick={logout}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
