"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const financeLinks = [
  {
    section: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/finance", icon: "📊" },
      { name: "Memory", href: "/finance/memory", icon: "🧠" },
    ],
  },
  {
    section: "MONEY TRACKING",
    items: [
      { name: "Transactions", href: "/finance/transactions", icon: "💳" },
      { name: "Category Analytics", href: "/finance/category-analytics", icon: "📈" },
      { name: "Expenditure Pattern", href: "/finance/expenditure-pattern", icon: "📉" },
    ],
  },
  {
    section: "PLANNING",
    items: [
      { name: "Savings Goals", href: "/finance/savings-goals", icon: "🎯" },
      { name: "Investment Planner", href: "/finance/investment-planner", icon: "💼" },
    ],
  },
  {
    section: "AI FEATURES",
    items: [
      { name: "Finance Insights", href: "/finance/insights", icon: "✨" },
      { name: "AI Chat", href: "/finance/chat", icon: "🤖" },
    ],
  },
];

export default function FinanceSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 overflow-y-auto border-r border-slate-800 bg-slate-950 p-5">
      <Link href="/twin-hub" className="text-xs text-slate-400 hover:text-white">
        ← Back to Twin Hub
      </Link>

      <div className="mb-8 mt-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-3xl shadow-lg shadow-emerald-900/30">
          💰
        </div>

        <h1 className="mt-4 text-xl font-bold text-white">Finance Twin</h1>
        <p className="text-sm text-slate-400">AI Finance Operating System</p>
      </div>

      <nav className="space-y-6 pb-6">
        {financeLinks.map((group) => (
          <div key={group.section}>
            <p className="mb-3 text-xs font-semibold tracking-widest text-slate-500">
              {group.section}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const active =
  item.href === "/finance"
    ? pathname === "/finance"
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                      active
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
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