import Link from "next/link";

const mainFeatures = [
  {
    title: "Personal HQ",
    subtitle: "Main Dashboard",
    description:
      "Your daily overview of scores, priorities, goals, and recommendations.",
    href: "/personal-hq",
    style: "border-cyan-500/40 bg-cyan-500/10 hover:border-cyan-300",
  },
  {
    title: "Digital Twin Advisor",
    subtitle: "Master Brain",
    description:
      "Ask cross-life strategy questions using Career, Finance, Health, Learning, and Personal Memory.",
    href: "/digital-twin-advisor",
    style: "border-violet-500/40 bg-violet-500/10 hover:border-violet-300",
  },
  
];

const intelligenceFeatures = [
  {
    title: "Daily Brief",
    subtitle: "Daily Intelligence",
    href: "/twin-brief",
  },
  {
    title: "Notification Center",
    subtitle: "Proactive Alerts",
    href: "/twin-notifications",
  },
  {
    title: "Personal Memory",
    subtitle: "Shared Memory",
    href: "/personal-memory",
  },
];

const twins = [
  {
    title: "Career Twin",
    description: "Jobs, resumes, interviews, applications, and career growth.",
    href: "/career",
  },
  {
    title: "Finance Twin",
    description: "Income, expenses, savings, budgeting, and finance insights.",
    href: "/finance",
  },
  {
    title: "Health Twin",
    description: "Habits, sleep, hydration, workouts, diet, and wellness.",
    href: "/health",
  },
  {
    title: "Learning Twin",
    description: "Skills, certifications, courses, study plans, and roadmaps.",
    href: "/learning",
  },
];

export default function TwinHubPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <p className="text-sm text-cyan-300">Twin Hub</p>

          <h1 className="mt-3 text-4xl font-bold">
            Your Digital Twin Workspace
          </h1>

          <p className="mt-4 max-w-3xl text-slate-400">
            Start from Personal HQ, ask your Digital Twin Advisor, or open a specialized twin for career, finance, health, and learning., or
            open a specialized twin for career, finance, health, and learning.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {mainFeatures.map((item) => (
            <Link key={item.title} href={item.href}>
              <div
                className={`rounded-3xl border p-7 transition hover:-translate-y-1 ${item.style}`}
              >
                <p className="text-sm text-cyan-300">{item.subtitle}</p>
                <h2 className="mt-3 text-3xl font-bold">{item.title}</h2>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {item.description}
                </p>
                <div className="mt-5 inline-flex rounded-full bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300">
                  Open
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {intelligenceFeatures.map((item) => (
            <Link key={item.title} href={item.href}>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-cyan-400">
                <p className="text-sm text-cyan-300">{item.subtitle}</p>
                <h2 className="mt-2 text-2xl font-bold">{item.title}</h2>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <p className="text-sm text-cyan-300">Specialized Twins</p>
          <h2 className="mt-2 text-2xl font-bold">Choose an Agent</h2>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {twins.map((item) => (
              <Link key={item.title} href={item.href}>
                <div className="h-full rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-cyan-400">
                  <p className="text-sm text-emerald-300">Available</p>
                  <h3 className="mt-2 text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}