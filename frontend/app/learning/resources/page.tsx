"use client";

import { useEffect, useState } from "react";

type LearningGoal = {
  id: number;
  topic: string;
  category: string;
  current_level: string;
  target_level: string;
  resource: string;
  resource_link: string;
  status: string;
  notes: string;
};

export default function LearningResourcesPage() {
  const [goals, setGoals] = useState<LearningGoal[]>([]);

  const fetchGoals = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/learning/`);
    const data = await res.json();
    setGoals(data);
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-cyan-300">Learning Twin</p>

        <h1 className="mt-2 text-4xl font-bold">Learning Resources</h1>

        <p className="mt-3 max-w-3xl text-slate-400">
          View all saved learning resources connected to your learning goals.
        </p>

        <section className="mt-8 rounded-2xl bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Saved Resources</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-xl border border-cyan-500/20 bg-slate-950 p-5"
              >
                <p className="text-sm text-cyan-300">{goal.category}</p>

                <h3 className="mt-2 text-xl font-bold">{goal.topic}</h3>

                <p className="mt-3 text-sm text-slate-400">
                  Level: {goal.current_level} → {goal.target_level}
                </p>

                <p className="mt-3 text-slate-300">
                  {goal.resource || "No resource added yet."}
                </p>

                {goal.resource_link && (
                  <a
                    href={goal.resource_link}
                    target="_blank"
                    className="mt-4 inline-block rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium hover:bg-cyan-500"
                  >
                    Open Resource
                  </a>
                )}
              </div>
            ))}
          </div>

          {goals.length === 0 && (
            <p className="mt-6 text-slate-400">
              No learning resources found yet. Add resources from Learning Goals.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}