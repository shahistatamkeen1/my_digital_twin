import Link from "next/link";
import AgentCard from "../components/AgentCard";
import SpatialCard from "../components/SpatialCard";

export default function TwinHubPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="absolute bottom-20 right-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

      <section className="relative mx-auto max-w-7xl">
        <SpatialCard>
          <p className="text-sm text-cyan-300">Twin Selection Hub</p>

          <h1 className="mt-3 text-4xl font-bold">
            Choose your Digital Twin
          </h1>

          <p className="mt-4 max-w-3xl text-slate-400">
            Start with the Master Twin Orchestrator, or open a specialized twin
            for career, finance, health, or learning.
          </p>
        </SpatialCard>

        <Link href="/twin-orchestrator">
          <div className="mt-8 rounded-3xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/10 to-violet-600/10 p-8 shadow-2xl shadow-cyan-500/10 transition hover:-translate-y-1 hover:border-cyan-300">
            <p className="text-sm text-cyan-300">Master Brain</p>

            <h2 className="mt-3 text-3xl font-bold">
              Twin Orchestrator
            </h2>

            <p className="mt-4 max-w-3xl text-slate-300">
              Ask cross-life questions that combine Career Twin and Finance Twin
              intelligence for smarter decisions across work, money, goals, and planning.
            </p>

            <div className="mt-5 inline-flex rounded-full bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300">
              Available
            </div>
          </div>
        </Link>

        <Link href="/twin-brief">
  <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6 transition hover:-translate-y-1 hover:border-cyan-300">
    <p className="text-sm text-cyan-300">Daily Intelligence</p>
    <h2 className="mt-2 text-2xl font-bold">Daily Brief</h2>
    <p className="mt-3 text-slate-400">
      Generate a daily plan using your personal, career, finance, and health twin data.
    </p>
  </div>
</Link>

        <Link href="/personal-memory">
  <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-indigo-400">
    <p className="text-sm text-indigo-300">Shared Memory Layer</p>
    <h2 className="mt-2 text-2xl font-bold">Personal Memory</h2>
    <p className="mt-3 text-slate-400">
      Store your shared identity, schedule, priorities, and long-term goals for all twins.
    </p>
  </div>
</Link>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <AgentCard
            title="Career Twin"
            description="Your AI career copilot for jobs, resumes, interviews, cover letters, applications, and career growth."
            status="available"
            href="/career"
          />

          <AgentCard
            title="Finance Twin"
            description="Track income, expenses, savings goals, spending categories, AI insights, and financial habits."
            status="available"
            href="/finance"
          />

          <AgentCard
  title="Health Twin"
  description="Track wellness goals, daily habits, sleep, hydration, workouts, and AI health insights."
  status="available"
  href="/health"
/>

          <AgentCard
            title="Learning Twin"
            description="Create study plans, track skills, prepare for certifications, and build learning roadmaps."
            status="coming-soon"
            href="/learning"
          />
        </div>
      </section>
    </main>
  );
}