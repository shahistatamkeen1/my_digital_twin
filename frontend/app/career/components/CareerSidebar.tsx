"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
      { name: "Application Kanban", href: "/career/application-kanban", icon: "📋" },
    ],
  },
  {
    section: "CAREER GROWTH",
    items: [
      { name: "Roadmap", href: "/career/roadmap", icon: "🗺️" },
      { name: "Resume", href: "/career/resume", icon: "📑" },
      { name: "Cover Letter", href: "/career/cover-letter", icon: "✉️" },
      { name: "Interview Prep", href: "/career/interview-prep", icon: "🎤" },
    ],
  },
  {
    section: "AI FEATURES",
    items: [
      { name: "Career Intelligence", href: "/career/career-intelligence", icon: "✨" },
      { name: "AI Chat", href: "/career/chat", icon: "🤖" },
    ],
  },
];

export default function CareerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 overflow-y-auto border-r border-slate-800 bg-slate-950 p-5">
      <Link href="/twin-hub" className="text-xs text-slate-400 hover:text-white">
        ← Back to Twin Hub
      </Link>

      <div className="mb-8 mt-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl shadow-lg shadow-purple-900/30">
          💼
        </div>

        <h1 className="mt-4 text-xl font-bold text-white">Career Twin</h1>
        <p className="text-sm text-slate-400">AI Career Operating System</p>
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
  );
}