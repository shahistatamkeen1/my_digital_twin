import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6">
      <section className="max-w-5xl mx-auto py-24 text-center">
        <p className="text-indigo-400 font-medium">
          AI-Powered Career Twin
        </p>

        <h1 className="text-5xl font-bold mt-4">
          My Digital Twin
        </h1>

        <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
          Your personal AI career assistant for resume analysis,
          job matching, application tracking, and career growth planning.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-lg bg-indigo-600 px-6 py-3 font-medium hover:bg-indigo-500"
          >
            Open Dashboard
          </Link>

          <Link
            href="/resume"
            className="rounded-lg border border-slate-700 px-6 py-3 font-medium hover:bg-slate-900"
          >
            Upload Resume
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
        <div className="bg-slate-900 p-6 rounded-xl">
          <h3 className="font-semibold text-lg">Resume Intelligence</h3>
          <p className="mt-3 text-slate-400 text-sm">
            Upload your resume and extract career insights instantly.
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <h3 className="font-semibold text-lg">Job Match Scoring</h3>
          <p className="mt-3 text-slate-400 text-sm">
            Compare your resume with job descriptions and find missing skills.
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <h3 className="font-semibold text-lg">Application Tracker</h3>
          <p className="mt-3 text-slate-400 text-sm">
            Track saved, applied, interview, offer, and rejected jobs.
          </p>
        </div>
      </section>
    </main>
  );
}