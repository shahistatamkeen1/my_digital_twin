import PrimaryButton from "./components/PrimaryButton";
import SpatialCard from "./components/SpatialCard";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-8 py-20">
        <div className="max-w-4xl">
          <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-cyan-300">
            AI-Powered Personal Operating System
          </p>

          <h1 className="text-6xl font-bold leading-tight md:text-7xl">
            My Digital Twin
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A multi-agent AI platform that helps you manage your career,
            applications, interviews, resume, and future personal workflows
            through intelligent digital twins.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <div className="mt-8 flex flex-wrap gap-4">

  <PrimaryButton href="/twin-hub">
    Enter Twin Hub
  </PrimaryButton>

  <PrimaryButton href="/login">
    Login
  </PrimaryButton>

</div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          <SpatialCard>
            <h2 className="text-xl font-semibold">Career Twin</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Discover jobs, optimize resumes, generate cover letters, prepare
              for interviews, and track applications.
            </p>
          </SpatialCard>

          <SpatialCard>
            <h2 className="text-xl font-semibold">Finance Twin</h2>
<p className="mt-3 text-sm leading-6 text-slate-400">
  Track income, expenses, savings goals, category spending, and receive AI-powered financial insights.
</p>
          </SpatialCard>

          <SpatialCard>
            <h2 className="text-xl font-semibold">Health Twin</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Future agent for daily wellness, nutrition suggestions, habits,
              and locality-based health guidance.
            </p>
          </SpatialCard>
        </div>
      </section>
    </main>
  );
}