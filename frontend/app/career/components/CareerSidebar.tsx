"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const careerLinks = [
  {
    section: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/career/dashboard", icon: "📊" },
      { name: "Profile", href: "/career/profile", icon: "👤" },
      { name: "Memory", href: "/career/memory", icon: "🧠" },
    ],
  },
  {
    section: "JOB SEARCH",
    items: [
      { name: "Job Discovery", href: "/career/job-discovery", icon: "🔍" },
      { name: "Applications", href: "/career/applications", icon: "📄" },
      {
        name: "Application Kanban",
        href: "/career/application-kanban",
        icon: "📋",
      },
    ],
  },
  {
    section: "CAREER GROWTH",
    items: [
      { name: "Roadmap", href: "/career/roadmap", icon: "🗺️" },
      { name: "Resume", href: "/career/resume", icon: "📑" },
      {
        name: "Cover Letter",
        href: "/career/cover-letter",
        icon: "✉️",
      },
      {
        name: "Interview Prep",
        href: "/career/interview-prep",
        icon: "🎤",
      },
    ],
  },
  {
    section: "AI FEATURES",
    items: [
      {
        name: "Career Intelligence",
        href: "/career/career-intelligence",
        icon: "✨",
      },
      { name: "AI Chat", href: "/career/chat", icon: "🤖" },
    ],
  },
];

const mobileLinks = [
  { name: "Dashboard", href: "/career/dashboard", icon: "📊" },
  { name: "Jobs", href: "/career/job-discovery", icon: "🔍" },
  { name: "Applications", href: "/career/applications", icon: "📄" },
  { name: "AI Chat", href: "/career/chat", icon: "🤖" },
];

export default function CareerSidebar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 overflow-y-auto border-r border-slate-800 bg-slate-950 p-5 lg:block">
        <Link
          href="/twin-hub"
          className="text-xs text-slate-400 hover:text-white"
        >
          ← Back to Twin Hub
        </Link>

        <div className="mb-8 mt-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl shadow-lg shadow-purple-900/30">
            💼
          </div>

          <h1 className="mt-4 text-xl font-bold text-white">Career Twin</h1>
          <p className="text-sm text-slate-400">
            AI Career Operating System
          </p>
        </div>

        <nav className="space-y-6 pb-6">
          {careerLinks.map((group) => (
            <div key={group.section}>
              <p className="mb-3 text-xs font-semibold tracking-widest text-slate-500">
                {group.section}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                        active
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur lg:hidden">
        <Link href="/career/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl">
            💼
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Career Twin</p>
            <p className="text-xs text-slate-400">Career OS</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="rounded-xl border border-slate-700 px-3 py-2 text-lg text-slate-200"
          aria-label="Open career navigation"
        >
          ☰
        </button>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/70"
          />

          <aside className="absolute right-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto border-l border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-300">Career Twin</p>
                <h2 className="mt-1 text-xl font-bold">Navigation</h2>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-slate-700 px-3 py-2"
                aria-label="Close career navigation"
              >
                ✕
              </button>
            </div>

            <Link
              href="/twin-hub"
              onClick={() => setMenuOpen(false)}
              className="mt-6 block rounded-xl border border-slate-800 px-4 py-3 text-sm text-slate-300"
            >
              ← Back to Twin Hub
            </Link>

            <nav className="mt-6 space-y-6 pb-8">
              {careerLinks.map((group) => (
                <div key={group.section}>
                  <p className="mb-3 text-xs font-semibold tracking-widest text-slate-500">
                    {group.section}
                  </p>

                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const active = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                            active
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-900 text-slate-300"
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mobileLinks.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="max-w-full truncate">{item.name}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] text-slate-400"
          >
            <span className="text-base">☰</span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}