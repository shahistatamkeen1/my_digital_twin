"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navSections = [
  {
    title: "CORE HUBS",
    items: [
      { name: "Personal HQ", href: "/personal-hq", icon: "🏠" },
      { name: "Progress Center", href: "/progress-center", icon: "📊" },
      { name: "Career Copilot", href: "/career", icon: "💼" },
      { name: "Skill Arena", href: "/learning", icon: "🧠" },
      { name: "Application Hub", href: "/applications", icon: "📄" },
      { name: "Finance Hub", href: "/finance", icon: "💰" },
      { name: "Health Hub", href: "/health", icon: "❤️" },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { name: "AI Coach", href: "/ai-coach", icon: "🤖" },
      { name: "Timeline Feed", href: "/timeline", icon: "🕒" },
      { name: "Smart Insights", href: "/smart-insights", icon: "✨" },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Settings", href: "/settings", icon: "⚙️" },
      { name: "Help & Support", href: "/help", icon: "❔" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 glass-card border-r border-slate-800 p-5">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 text-xl">
          🧬
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">My Digital Twin</h1>
          <p className="text-xs text-slate-400">AI Life OS</p>
        </div>
      </div>

      <nav className="space-y-7">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="mb-3 text-xs font-semibold tracking-widest text-slate-500">
              {section.title}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-900/30"
                        : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
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

      <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-sm font-semibold text-white">You’re on fire 🔥</p>
        <p className="mt-1 text-xs text-slate-400">7 day streak active.</p>
      </div>
    </aside>
  );
}