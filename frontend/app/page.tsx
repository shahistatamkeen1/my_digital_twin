import Link from "next/link";

const twins = [
  {
    title: "Career Twin",
    icon: "💼",
    description: "Track jobs, resumes, interviews, applications, and career growth.",
  },
  {
    title: "Finance Twin",
    icon: "💰",
    description: "Manage expenses, income, savings, budgets, and financial goals.",
  },
  {
    title: "Health Twin",
    icon: "❤️",
    description: "Build habits around wellness, sleep, hydration, workouts, and routines.",
  },
  {
    title: "Learning Twin",
    icon: "📚",
    description: "Plan skills, courses, certifications, projects, and learning roadmaps.",
  },
];

const stats = [
  { value: "4", label: "Active Twins", sub: "Connected", icon: "👥" },
  { value: "10+", label: "AI Modules", sub: "Running", icon: "🧠" },
  { value: "100%", label: "Privacy First", sub: "Your data, always yours", icon: "🛡️" },
  { value: "24/7", label: "AI Companion", sub: "Always here to help", icon: "📈" },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_25%,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_75%_20%,rgba(139,92,246,0.22),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(34,211,238,0.13),transparent_35%)]" />

      <header className="relative z-20 flex items-center justify-between border-b border-white/10 px-10 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600 text-2xl shadow-lg shadow-cyan-500/30">
            🧬
          </div>
          <h1 className="text-2xl font-bold">My Digital Twin</h1>
        </div>

        <nav className="hidden gap-12 text-sm text-slate-300 lg:flex">
          <span>Features</span>
          <span>How It Works</span>
          <span>Twins</span>
          <span>Security</span>
          <span>About</span>
        </nav>

        <Link
          href="/login"
          className="rounded-2xl border border-slate-700 px-5 py-2 text-sm text-slate-200 hover:border-cyan-400"
        >
          👤 Login
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-90px)] w-full max-w-[1800px] grid-cols-1 items-center gap-8 px-14 py-8 xl:grid-cols-[0.85fr_1.45fr_0.95fr]">
        <div className="max-w-2xl">
          <p className="inline-flex rounded-full border border-cyan-500/40 bg-cyan-500/10 px-5 py-2 text-sm font-semibold text-cyan-300">
            ⚡ AI-Powered Personal Operating System
          </p>

          <h2 className="mt-8 text-7xl font-extrabold leading-tight 2xl:text-8xl">
            My Digital
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
              Twin
            </span>
          </h2>

          <p className="mt-7 text-lg leading-8 text-slate-300">
            Your AI companion that connects all aspects of your life — career,
            finance, health, learning, memory, and personal growth.
          </p>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            One brain. Four specialized twins.
            <br />
            Endless possibilities.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/twin-hub"
              className="rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-9 py-4 text-lg font-semibold shadow-lg shadow-violet-700/30 hover:opacity-90"
            >
              Enter Twin Hub →
            </Link>

            <button className="rounded-2xl border border-slate-700 px-9 py-4 text-lg font-semibold text-slate-200 hover:border-cyan-400">
              Watch Demo ▶
            </button>
          </div>

          <p className="mt-8 text-sm text-slate-500">
            🔒 Your data is private, secure, and always yours.
          </p>
        </div>

        <div className="relative flex min-h-[760px] items-center justify-center overflow-visible">
          <div className="absolute h-[760px] w-[760px] rounded-full border border-blue-500/25" />
          <div className="absolute h-[620px] w-[620px] rounded-full border border-violet-500/20" />
          <div className="absolute h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-[120px]" />
          <div className="absolute bottom-16 h-20 w-[560px] rounded-[50%] border border-blue-500/50 bg-blue-500/10 shadow-2xl shadow-blue-500/30" />

          <div className="absolute left-16 top-36 z-20 flex h-16 w-16 items-center justify-center rounded-full border border-violet-500/50 bg-violet-500/20 text-3xl shadow-lg shadow-violet-500/30">
            💼
          </div>
          <div className="absolute right-20 top-64 z-20 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-500/20 text-3xl shadow-lg shadow-emerald-500/30">
            💰
          </div>
          <div className="absolute left-8 bottom-48 z-20 flex h-16 w-16 items-center justify-center rounded-full border border-pink-500/50 bg-pink-500/20 text-3xl shadow-lg shadow-pink-500/30">
            ❤️
          </div>
          <div className="absolute right-12 bottom-36 z-20 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-500/50 bg-cyan-500/20 text-3xl shadow-lg shadow-cyan-500/30">
            📚
          </div>

          <div className="absolute right-8 top-12 z-30 max-w-[330px] rounded-3xl border border-violet-500/60 bg-[#020617]/75 p-6 shadow-2xl shadow-violet-900/40 backdrop-blur-xl">
            <p className="text-lg font-bold">👋 Hi! I&apos;m your</p>
            <p className="text-xl font-bold text-cyan-400">AI Twin Assistant.</p>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              I help you stay on track, make better decisions, and achieve your goals faster.
            </p>
            <p className="mt-4 font-semibold text-cyan-300">Shall we begin?</p>
          </div>

          <div className="relative z-10 h-[760px] w-[760px] overflow-visible">
  <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-[130px]" />

  <div
    className="
      absolute inset-0
      bg-[url('/images/ai-twin-avatar.png')]
      bg-contain bg-center bg-no-repeat
      opacity-95
      mix-blend-lighten
      drop-shadow-[0_0_70px_rgba(34,211,238,0.45)]
      [mask-image:radial-gradient(ellipse_at_center,black_38%,rgba(0,0,0,0.85)_52%,rgba(0,0,0,0.35)_68%,transparent_82%)]
      [-webkit-mask-image:radial-gradient(ellipse_at_center,black_38%,rgba(0,0,0,0.85)_52%,rgba(0,0,0,0.35)_68%,transparent_82%)]
    "
  />

  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#020617] via-transparent to-[#020617]/30" />
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#020617]/10 via-transparent to-[#020617]/75" />
</div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <p className="text-sm font-semibold text-violet-300">🧠 AI Twin Network</p>
          <h2 className="mt-4 text-3xl font-bold">One Brain. Four Twins.</h2>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {twins.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-700/70 bg-slate-950/70 p-6 transition duration-300 hover:scale-[1.03] hover:border-cyan-400"
              >
                <div className="text-3xl">{item.icon}</div>
                <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {item.description}
                </p>
                <p className="mt-4 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                  ● Active
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
            <p className="text-sm text-cyan-300">Platform Status</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">Active</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Career, Finance, Health, and Learning Twins connected and ready.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto mb-10 grid w-[calc(100%-6rem)] max-w-[1700px] grid-cols-1 gap-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl md:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 border-slate-700 md:border-r last:border-r-0"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-3xl">
              {item.icon}
            </div>
            <div>
              <p className="text-4xl font-bold">{item.value}</p>
              <p className="text-sm text-slate-300">{item.label}</p>
              <p className="text-xs text-slate-500">{item.sub}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}