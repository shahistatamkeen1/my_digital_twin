import Link from "next/link";

export default function FinanceSidebar() {
  const links = [
  { href: "/finance/dashboard", label: "Dashboard" },
  { href: "/finance/memory", label: "Finance Memory" },
  { href: "/finance/transactions", label: "Transactions" },
  { href: "/finance/category-analytics", label: "Category Analytics" },
  { href: "/finance/savings-goals", label: "Savings Goals" },
  { href: "/finance/insights", label: "AI Insights" },
  { href: "/finance/expenditure-pattern", label: "Expenditure Pattern" },
  { href: "/finance/investment-planner", label: "Investment Planner" },
  { href: "/finance/chat", label: "Finance Chat" },
  { href: "/twin-hub", label: "← Twin Hub" },
];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950 border-r border-slate-800 text-white p-6 overflow-y-auto">
      <Link href="/finance/dashboard" className="block">
        <h1 className="text-xl font-bold">Finance Twin</h1>
        <p className="text-xs text-slate-400 mt-1">Financial Command Center</p>
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