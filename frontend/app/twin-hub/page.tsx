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
            Start with Career Twin today. Finance, Health, and Learning Twins
            are prepared as future agent modules in the same platform.
          </p>
        </SpatialCard>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <AgentCard
            title="Career Twin"
            description="Your AI career copilot for jobs, resumes, interviews, cover letters, applications, and career growth."
            status="available"
            href="/career"
          />

          <AgentCard
            title="Finance Twin"
            description="Manage spending, budgeting, alerts, savings goals, and financial planning."
            status="coming-soon"
            href="/finance"
          />

          <AgentCard
            title="Health Twin"
            description="Plan meals, track wellness, receive health suggestions, and find local healthy options."
            status="coming-soon"
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