"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const learningLinks = [
  {
    section: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/learning/dashboard", icon: "📊" },
      { name: "Memory", href: "/learning/memory", icon: "🧠" },
    ],
  },
  {
    section: "LEARNING",
    items: [
      { name: "Roadmap", href: "/learning/roadmap", icon: "🗺️" },
      { name: "Resources", href: "/learning/resources", icon: "📚" },
      { name: "Progress Tracker", href: "/learning/progress", icon: "📈" },
      { name: "Next Task", href: "/learning/next-task", icon: "🚀" },
    ],
  },
  {
    section: "AI FEATURES",
    items: [
      { name: "Learning Insights", href: "/learning/insights", icon: "✨" },
      { name: "AI Chat", href: "/learning/chat", icon: "🤖" },
    ],
  },
];

export default function LearningSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/learning/dashboard") {
      return pathname === "/learning" || pathname === "/learning/dashboard";
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
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 overflow-y-auto border-r border-slate-800 bg-slate-950 p-5 lg:block">
        <Link
          href="/twin-hub"
          className="text-xs text-slate-400 transition hover:text-white"
        >
          ← Back to Twin Hub
        </Link>

        <div className="mb-8 mt-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-3xl shadow-lg shadow-cyan-900/30">
            📚
          </div>

          <h1 className="mt-4 text-xl font-bold text-white">Learning Twin</h1>

          <p className="text-sm text-slate-400">
            AI Learning Operating System
          </p>
        </div>

        <LearningNavigation
          isActive={isActive}
          onNavigate={() => undefined}
        />
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-xl shadow-lg shadow-cyan-900/30">
              📚
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-cyan-300">
                Learning Twin
              </p>

              <p className="truncate text-sm font-semibold text-white">
                AI Learning Operating System
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Learning navigation"
            aria-expanded={mobileMenuOpen}
            aria-controls="learning-mobile-navigation"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm font-medium text-white transition hover:border-cyan-500/60 hover:bg-slate-800"
          >
            <MenuIcon />
            <span>Menu</span>
          </button>
        </div>
      </header>

      <button
        type="button"
        aria-label="Close Learning navigation"
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="learning-mobile-navigation"
        aria-label="Learning Twin navigation"
        aria-hidden={!mobileMenuOpen}
        className={`fixed inset-y-0 right-0 z-[60] w-[88%] max-w-[360px] overflow-y-auto overscroll-contain border-l border-slate-800 bg-[#020617] px-4 pb-8 pt-5 shadow-2xl shadow-black/60 transition-transform duration-300 ease-out lg:hidden sm:px-5 ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-xl ring-1 ring-cyan-500/20">
              📚
            </div>

            <div>
              <p className="text-xs font-medium text-cyan-300">
                Learning Twin
              </p>

              <h2 className="mt-1 text-xl font-bold text-white">Navigation</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close Learning navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 text-slate-300 transition hover:border-cyan-500/60 hover:bg-slate-900 hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        <Link
          href="/twin-hub"
          onClick={() => setMobileMenuOpen(false)}
          className="mt-6 flex w-full items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-3.5 text-sm font-medium text-slate-300 transition hover:border-cyan-500/40 hover:bg-slate-900 hover:text-white"
        >
          ← Back to Twin Hub
        </Link>

        <div className="mt-6">
          <LearningNavigation
            isActive={isActive}
            onNavigate={() => setMobileMenuOpen(false)}
            mobile
          />
        </div>
      </aside>
    </>
  );
}

function LearningNavigation({
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
      aria-label="Learning Twin links"
      className={mobile ? "space-y-7 pb-4" : "space-y-6 pb-8"}
    >
      {learningLinks.map((group) => (
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
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-950/40"
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
