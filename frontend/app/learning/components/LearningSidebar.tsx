"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 overflow-y-auto border-r border-slate-800 bg-slate-950 p-5">
      {/* Back Button */}
      <Link
        href="/twin-hub"
        className="text-xs text-slate-400 transition hover:text-white"
      >
        ← Back to Twin Hub
      </Link>

      {/* Header */}
      <div className="mb-8 mt-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-3xl shadow-lg shadow-cyan-900/30">
          📚
        </div>

        <h1 className="mt-4 text-xl font-bold text-white">
          Learning Twin
        </h1>

        <p className="text-sm text-slate-400">
          AI Learning Operating System
        </p>
      </div>

      {/* Navigation */}
      <nav className="space-y-6 pb-6">
        {learningLinks.map((group) => (
          <div key={group.section}>
            <p className="mb-3 text-xs font-semibold tracking-widest text-slate-500">
              {group.section}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
                      active
                        ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/30"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}