"use client";

import { useState } from "react";

type RoadmapStep = {
  title: string;
  goal: string;
  why: string;
  actions: string[];
};

export default function LearningRoadmapPage() {
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(false);

  const generateRoadmap = async () => {
    setLoading(true);
    setSteps([]);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning-chat/roadmap`
      );

      const data = await res.json();
      if (Array.isArray(data.roadmap)) {
  setSteps(data.roadmap);
} else {
  console.error("Roadmap is not an array:", data);
  setSteps([]);
  alert("Backend is still returning text. Update backend roadmap response to JSON array.");
}
    } catch (error) {
      console.error(error);
      alert("Could not generate roadmap.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-cyan-300">Learning Twin</p>

        <h1 className="mt-2 text-4xl font-bold">
          AI Learning Roadmap
        </h1>

        <p className="mt-3 max-w-3xl text-slate-400">
          Generate a personalized learning roadmap based on your saved goals,
          current level, and target outcomes.
        </p>

        <section className="mt-8 rounded-2xl bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">
                Personalized Study Plan
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Create a structured weekly learning roadmap with clear goals and actions.
              </p>
            </div>

            <button
              onClick={generateRoadmap}
              disabled={loading}
              className="rounded-lg bg-cyan-600 px-5 py-3 font-medium hover:bg-cyan-500 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Roadmap"}
            </button>
          </div>

          <div className="mt-8 space-y-5">
            {steps.map((step, index) => (
              <div
                key={index}
                className="rounded-xl border border-cyan-500/30 bg-slate-950 p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-300">
                    Step {index + 1}
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    {step.title}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg bg-slate-900 p-4">
                    <p className="text-sm font-semibold text-cyan-300">
                      📚 Learning Goal
                    </p>
                    <p className="mt-1 text-slate-200">{step.goal}</p>
                  </div>

                  <div className="rounded-lg bg-slate-900 p-4">
                    <p className="text-sm font-semibold text-violet-300">
                      💡 Why It Matters
                    </p>
                    <p className="mt-1 text-slate-200">{step.why}</p>
                  </div>

                  <div className="rounded-lg bg-slate-900 p-4">
                    <p className="text-sm font-semibold text-emerald-300">
                      ✅ Action Items
                    </p>

                    <ul className="mt-3 space-y-2">
                      {step.actions.map((action, i) => (
                        <li key={i} className="flex gap-2 text-slate-200">
                          <span className="text-cyan-400">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}