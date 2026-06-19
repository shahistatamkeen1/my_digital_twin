import Link from "next/link";

export default function Sidebar() {
  const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Career Profile" },
  { href: "/memory", label: "Career Memory" },
  { href: "/roadmap", label: "Career Roadmap" },
  { href: "/resume", label: "Resume Center" },
  { href: "/job-discovery", label: "Job Discovery" },
  { href: "/applications", label: "Applications" },
  { href: "/application-kanban", label: "Application Kanban" },
  { href: "/job-match", label: "Job Match" },
  { href: "/ats-resume", label: "ATS Resume" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/interview-prep", label: "Interview Prep" },
  { href: "/chat", label: "Career Chat" },
];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950 border-r border-slate-800 text-white p-6">
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