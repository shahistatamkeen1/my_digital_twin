import Link from "next/link";

import UserMenu from "@/components/auth/UserMenu";

const operatingFeatures = [
  {
    title: "Personal HQ",
    subtitle: "AI Command Center",
    description:
      "Your centralized daily overview of twin scores, priorities, goals, recommendations, and next actions.",
    href: "/personal-hq",
    icon: "🏠",
    accent: "from-cyan-500 to-blue-600",
  },
  {
    title: "Digital Twin Advisor",
    subtitle: "Master Brain",
    description:
      "Ask cross-life strategy questions using Career, Finance, Health, Learning, and Personal Memory.",
    href: "/digital-twin-advisor",
    icon: "🧠",
    accent: "from-violet-500 to-purple-700",
  },
  {
    title: "Progress Center",
    subtitle: "Growth Intelligence",
    description:
      "Track progress, achievements, growth forecasts, scorecards, and long-term Digital Twin improvement.",
    href: "/progress-center",
    icon: "📈",
    accent: "from-emerald-500 to-cyan-600",
  },
];

const intelligenceFeatures = [
  { title: "Daily Brief", subtitle: "Daily Intelligence", href: "/twin-brief", icon: "📰" },
  { title: "Notification Center", subtitle: "Proactive Alerts", href: "/twin-notifications", icon: "🔔" },
  { title: "Personal Memory", subtitle: "Shared Memory", href: "/personal-memory", icon: "🧬" },
];

const twins = [
  {
    title: "Career Twin",
    description: "Jobs, resumes, interviews, applications, and career growth.",
    href: "/career/dashboard",
    icon: "💼",
    status: "Career OS",
    accent: "from-indigo-500 to-purple-600",
  },
  {
    title: "Finance Twin",
    description: "Income, expenses, savings, budgeting, and finance insights.",
    href: "/finance",
    icon: "💰",
    status: "Finance OS",
    accent: "from-emerald-500 to-cyan-600",
  },
  {
    title: "Health Twin",
    description: "Habits, sleep, hydration, workouts, diet, and wellness.",
    href: "/health",
    icon: "❤️",
    status: "Wellness OS",
    accent: "from-pink-500 to-rose-600",
  },
  {
    title: "Learning Twin",
    description: "Skills, certifications, courses, study plans, and roadmaps.",
    href: "/learning",
    icon: "📚",
    status: "Learning OS",
    accent: "from-blue-500 to-cyan-500",
  },
];

const metrics = [
  { label: "Active Twins", value: "4" },
  { label: "AI Modules", value: "10+" },
  { label: "Memory Layer", value: "On" },
  { label: "Growth Engine", value: "Live" },
];

export default function TwinHubPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-6 py-10 text-white">
      <div className="pointer-events-none fixed left-[-160px] top-[-160px] h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none fixed right-[-180px] top-20 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />

      <section className="relative mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex text-sm text-slate-400 hover:text-white">
            ← Back to Home
          </Link>

          <UserMenu />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/30 lg:col-span-2">
            <p className="text-sm font-semibold text-cyan-300">🧬 My Digital Twin</p>

            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              Your AI Operating System
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
              One intelligence layer for your career, finance, health, learning,
              memory, goals, and personal growth.
            </p>

            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                href="/personal-hq"
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition hover:opacity-90"
              >
                Open Personal HQ
              </Link>

              <Link
                href="/digital-twin-advisor"
                className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-violet-400 hover:text-white"
              >
                Talk to Advisor
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/30">
            <p className="text-sm font-semibold text-violet-300">AI Brain Status</p>
            <h2 className="mt-3 text-2xl font-bold">All Systems Online</h2>

            <div className="mt-6 space-y-3 text-sm">
              {["Career Twin", "Finance Twin", "Health Twin", "Learning Twin"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-xl bg-slate-800/70 px-4 py-3">
                  <span className="text-slate-300">{item}</span>
                  <span className="text-emerald-400">Active</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
              <p className="text-sm text-cyan-300">Twin Network</p>
              <p className="mt-2 text-3xl font-bold">4 / 4</p>
              <p className="mt-1 text-sm text-slate-400">Twins connected</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {metrics.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-cyan-300">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <p className="text-sm font-semibold text-cyan-300">Operating System</p>
          <h2 className="mt-2 text-3xl font-bold">Start With Your Main Intelligence Layer</h2>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {operatingFeatures.map((item) => (
              <Link key={item.title} href={item.href}>
                <div className="h-full rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-cyan-400/70">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-3xl`}>
                    {item.icon}
                  </div>
                  <p className="mt-5 text-sm text-cyan-300">{item.subtitle}</p>
                  <h3 className="mt-2 text-2xl font-bold">{item.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-slate-400">{item.description}</p>
                  <p className="mt-6 text-sm font-semibold text-emerald-300">Open →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <p className="text-sm font-semibold text-violet-300">Shared Intelligence Layer</p>
          <h2 className="mt-2 text-3xl font-bold">Memory, Briefs, and Proactive Alerts</h2>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            {intelligenceFeatures.map((item) => (
              <Link key={item.title} href={item.href}>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition hover:-translate-y-1 hover:border-violet-400">
                  <div className="text-3xl">{item.icon}</div>
                  <p className="mt-4 text-sm text-violet-300">{item.subtitle}</p>
                  <h3 className="mt-2 text-2xl font-bold">{item.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/80 p-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-emerald-300">Specialized AI Twins</p>
              <h2 className="mt-2 text-3xl font-bold">Choose a Twin Workspace</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Each twin has its own workspace, memory, actions, and AI-powered tools.
              </p>
            </div>

            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-sm text-emerald-300">
              4 Twins Online
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {twins.map((item) => (
              <Link key={item.title} href={item.href}>
                <div className="h-full rounded-2xl border border-slate-800 bg-slate-950/70 p-6 transition hover:-translate-y-1 hover:border-cyan-400">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-3xl`}>
                    {item.icon}
                  </div>
                  <p className="mt-5 text-sm text-emerald-300">{item.status}</p>
                  <h3 className="mt-2 text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p>
                  <p className="mt-6 text-sm font-semibold text-cyan-300">Enter Workspace →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}