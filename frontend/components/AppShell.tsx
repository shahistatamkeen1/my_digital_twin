"use client";

import { usePathname, useRouter } from "next/navigation";

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
    label: "Memory",
    icon: "🧠",
    path: "/agent-memory",
  },
  {
    label: "Profiles",
    icon: "👤",
    path: "/agent-profiles",
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
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-slate-800 bg-slate-950 p-5 lg:block">
        <div>
          <p className="text-sm text-cyan-300">My Digital Twin</p>
          <h1 className="mt-2 text-2xl font-bold">Command Center</h1>
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                  active
                    ? "bg-cyan-500 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen pb-36 lg:ml-64 lg:pb-0">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 px-2 py-1.5 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const active = pathname === item.path;

            return (
              <button
  key={item.path}
  onClick={() => router.push(item.path)}
  className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs transition ${
                  active
                    ? "bg-cyan-500 text-white"
                    : "text-slate-400"
                }`}
              >
                <span>{item.icon}</span>
<span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}