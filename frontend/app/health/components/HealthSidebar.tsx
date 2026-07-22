"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const healthLinks = [
  {
    section: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/health/dashboard", icon: "📊" },
      { name: "Memory", href: "/health/memory", icon: "🧠" },
    ],
  },
  {
    section: "TRACKING",
    items: [{ name: "Habits", href: "/health/habits", icon: "🔥" }],
  },
  {
    section: "PLANNING",
    items: [
      { name: "Diet Planner", href: "/health/diet-planner", icon: "🥗" },
    ],
  },
  {
    section: "AI FEATURES",
    items: [
      { name: "Health Insights", href: "/health/insights", icon: "✨" },
      { name: "AI Chat", href: "/health/chat", icon: "🤖" },
    ],
  },
];

export default function HealthSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/health/dashboard") {
      return pathname === "/health" || pathname === "/health/dashboard";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", closeWithEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 overflow-y-auto border-r border-slate-800 bg-slate-950 p-5 lg:block">
        <Link
          href="/twin-hub"
          className="text-xs text-slate-400 transition hover:text-white"
        >
          ← Back to Twin Hub
        </Link>

        <div className="mb-8 mt-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-3xl shadow-lg shadow-rose-900/30">
            ❤️
          </div>

          <h1 className="mt-4 text-xl font-bold text-white">Health Twin</h1>
          <p className="text-sm text-slate-400">
            AI Wellness Operating System
          </p>
        </div>

        <HealthNavigation
          isActive={isActive}
          onNavigate={() => undefined}
        />
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-xl shadow-lg shadow-rose-900/30">
              ❤️
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-rose-300">
                Health Twin
              </p>
              <p className="truncate text-sm font-semibold text-white">
                AI Wellness Operating System
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Health navigation"
            aria-expanded={mobileMenuOpen}
            aria-controls="health-mobile-navigation"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm font-medium text-white transition hover:border-rose-500/60 hover:bg-slate-800"
          >
            <MenuIcon />
            <span>Menu</span>
          </button>
        </div>
      </header>

      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label="Close Health navigation"
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Mobile drawer: same side and direction as Career and Finance */}
      <aside
        id="health-mobile-navigation"
        aria-label="Health Twin navigation"
        aria-hidden={!mobileMenuOpen}
        className={`fixed inset-y-0 right-0 z-[60] w-[88%] max-w-[360px] overflow-y-auto overscroll-contain border-l border-slate-800 bg-[#020617] px-4 pb-8 pt-5 shadow-2xl shadow-black/60 transition-transform duration-300 ease-out lg:hidden sm:px-5 ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-xl ring-1 ring-rose-500/20">
              ❤️
            </div>

            <div>
              <p className="text-xs font-medium text-rose-300">Health Twin</p>
              <h2 className="mt-1 text-xl font-bold text-white">Navigation</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close Health navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 text-slate-300 transition hover:border-rose-500/60 hover:bg-slate-900 hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        <Link
          href="/twin-hub"
          onClick={() => setMobileMenuOpen(false)}
          className="mt-6 flex w-full items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3.5 text-sm font-medium text-slate-300 transition hover:border-rose-500/40 hover:bg-slate-900 hover:text-white"
        >
          ← Back to Twin Hub
        </Link>

        <div className="mt-6">
          <HealthNavigation
            isActive={isActive}
            onNavigate={() => setMobileMenuOpen(false)}
            mobile
          />
        </div>
      </aside>
    </>
  );
}

function HealthNavigation({
  isActive,
  onNavigate,
  mobile = false,
}: {
  isActive: (href: string) => boolean;
  onNavigate: () => void;
  mobile?: boolean;
}) {
  return (
    <nav
      aria-label="Health Twin links"
      className={mobile ? "space-y-7 pb-4" : "space-y-6 pb-8"}
    >
      {healthLinks.map((group) => (
        <div key={group.section}>
          <p className="mb-3 text-xs font-semibold tracking-[0.15em] text-slate-500">
            {group.section}
          </p>

          <div className={mobile ? "space-y-2" : "space-y-1.5"}>
            {group.items.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-950/40"
                      : mobile
                        ? "bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="flex w-5 shrink-0 items-center justify-center"
                  >
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}
