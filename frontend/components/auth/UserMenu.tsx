"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "./AuthProvider";

export default function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    return null;
  }

  const initials = user.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 shadow-lg shadow-black/20">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 text-xs font-bold text-white">
        {initials || "U"}
      </div>

      <div className="hidden min-w-0 sm:block">
        <p className="max-w-40 truncate text-sm font-semibold text-white">
          {user.full_name}
        </p>
        <p className="max-w-40 truncate text-xs text-slate-400">
          {user.email}
        </p>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loggingOut ? "..." : "Logout"}
      </button>
    </div>
  );
}
