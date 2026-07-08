"use client";

import { useState } from "react";

type NextTask = {
  title: string;
  reason: string;
  time_needed: string;
  steps: string[];
};

export default function NextTaskPage() {
  const [task, setTask] = useState<NextTask | null>(null);
  const [loading, setLoading] = useState(false);

  const generateTask = async () => {
    setLoading(true);
    setTask(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning-chat/next-task`
      );

      const data = await res.json();
      setTask(data.task || null);
    } catch (error) {
      console.error(error);
      alert("Could not generate next task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-cyan-300">Learning Twin</p>

        <h1 className="mt-2 text-4xl font-bold">Next Task</h1>

        <p className="mt-3 max-w-3xl text-slate-400">
          Get one focused AI-recommended task for today based on your learning
          goals and progress.
        </p>

        <section className="mt-8 rounded-2xl bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Today&apos;s Focus</h2>
              <p className="mt-2 text-sm text-slate-400">
                Generate a simple, realistic learning task you can complete today.
              </p>
            </div>

            <button
              onClick={generateTask}
              disabled={loading}
              className="rounded-lg bg-cyan-600 px-5 py-3 font-medium hover:bg-cyan-500 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Next Task"}
            </button>
          </div>

          {task && (
            <div className="mt-8 rounded-xl border border-cyan-500/30 bg-slate-950 p-6">
              <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-300">
                Recommended Task
              </span>

              <h3 className="mt-5 text-2xl font-bold">{task.title}</h3>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-slate-900 p-4">
                  <p className="text-sm font-semibold text-violet-300">
                    💡 Why This Task
                  </p>
                  <p className="mt-2 text-slate-300">{task.reason}</p>
                </div>

                <div className="rounded-lg bg-slate-900 p-4">
                  <p className="text-sm font-semibold text-cyan-300">
                    ⏱ Time Needed
                  </p>
                  <p className="mt-2 text-slate-300">{task.time_needed}</p>
                </div>
              </div>

              <div className="mt-5 rounded-lg bg-slate-900 p-4">
                <p className="text-sm font-semibold text-emerald-300">
                  ✅ Steps to Complete
                </p>

                <ul className="mt-3 space-y-2">
                  {task.steps.map((step, index) => (
                    <li key={index} className="flex gap-2 text-slate-300">
                      <span className="text-cyan-400">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}