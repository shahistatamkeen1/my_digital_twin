import Link from "next/link";

export default function HealthSidebar() {
  const links = [
    { href: "/health/dashboard", label: "Dashboard" },
    { href: "/health/memory", label: "Health Memory" },
    { href: "/health/habits", label: "Habits" },
    { href: "/health/diet-planner", label: "Diet Planner" },
    { href: "/health/insights", label: "AI Insights" },
    { href: "/health/chat", label: "Health Chat" },
    { href: "/twin-hub", label: "← Twin Hub" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950 border-r border-slate-800 text-white p-6 overflow-y-auto">
      <Link href="/health/dashboard" className="block">
        <h1 className="text-xl font-bold">Health Twin</h1>
        <p className="text-xs text-slate-400 mt-1">Wellness Command Center</p>
      </Link>

      <nav className="mt-10 space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}