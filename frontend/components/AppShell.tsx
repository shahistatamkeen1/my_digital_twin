"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import UserMenu from "@/components/auth/UserMenu";
import PendingApprovalBadge from "@/components/approvals/PendingApprovalBadge";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  {
    label: "HQ",
    icon: "🏠",
    path: "/personal-hq",
  },
  {
    label: "Advisor",
    icon: "🤖",
    path: "/digital-twin-advisor",
  },
  {
    label: "Approvals",
    icon: "✓",
    path: "/approvals",
    badge: true,
  },
  {
    label: "Memory",
    icon: "🧠",
    path: "/agent-memory",
  },
  {
    label: "Profiles",
    icon: "👤",
    path: "/twin-personality",
  },
  {
    label: "Reflections",
    icon: "🔄",
    path: "/agent-reflections",
  },
  {
    label: "Plans",
    icon: "📋",
    path: "/agent-plans",
  },
  {
    label: "Journal",
    icon: "📖",
    path: "/twin-journal",
  },
  {
    label: "Insights",
    icon: "📈",
    path: "/predictive-insights",
  },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-slate-800 bg-slate-950 p-5 lg:block">
        <div>
          <p className="text-sm text-cyan-300">My Digital Twin</p>
          <h1 className="mt-2 text-2xl font-bold">Command Center</h1>
        </div>

        <div className="mt-5">
          <UserMenu />
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                  active
                    ? "bg-cyan-500 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge && <PendingApprovalBadge compact />}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen pb-36 lg:ml-64 lg:pb-0">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex justify-end lg:hidden">
            <UserMenu />
          </div>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 px-2 py-1.5 backdrop-blur lg:hidden">
        <div className="flex gap-1 overflow-x-auto pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item) => {
            const active = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`relative flex min-w-[76px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] transition ${
                  active
                    ? "bg-cyan-500 text-white"
                    : "text-slate-400"
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className="absolute right-1 top-1"><PendingApprovalBadge compact /></span>}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
