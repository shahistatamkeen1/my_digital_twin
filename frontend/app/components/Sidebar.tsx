import Link from "next/link";

export default function Sidebar() {
  const links = [
  { href: "/career/dashboard", label: "Dashboard" },
  { href: "/career/profile", label: "Career Profile" },
  { href: "/career/memory", label: "Career Memory" },
  { href: "/career/roadmap", label: "Career Roadmap" },
  { href: "/career/resume", label: "Resume Center" },
  { href: "/career/job-discovery", label: "Job Discovery" },
  { href: "/career/applications", label: "Applications" },
  { href: "/career/application-kanban", label: "Application Pipeline" },
  { href: "/career/career-intelligence", label: "Career Intelligence" },
  { href: "/career/chat", label: "Career Chat" },
  { href: "/twin-hub", label: "← Twin Hub" },
];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950 border-r border-slate-800 text-white p-6 overflow-y-auto">
      <Link href="/" className="block">
        <h1 className="text-xl font-bold">My Digital Twin</h1>
        <p className="text-xs text-slate-400 mt-1">Career Twin MVP</p>
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