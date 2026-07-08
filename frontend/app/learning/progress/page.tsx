"use client";

import { useEffect, useState } from "react";

type LearningGoal = {
  id: number;
  topic: string;
  category: string;
  current_level: string;
  target_level: string;
  status: string;
};

export default function ProgressTrackerPage() {
  const [goals, setGoals] = useState<LearningGoal[]>([]);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning/`
      );

      const data = await res.json();
      setGoals(data);
    } catch (err) {
      console.error(err);
    }
  };

  const completed = goals.filter(
    (g) => g.status?.toLowerCase() === "completed"
  ).length;

  const inProgress = goals.filter(
    (g) => g.status?.toLowerCase() === "in progress"
  ).length;

  const progressPercentage =
    goals.length > 0
      ? Math.round((completed / goals.length) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-cyan-300">
          Learning Twin
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Progress Tracker
        </h1>

        <p className="mt-3 text-slate-400">
          Monitor your learning journey and track skill growth.
        </p>

        {/* Stats */}

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-xl bg-slate-900 p-6">
            <p className="text-slate-400">
              Total Goals
            </p>

            <h2 className="mt-2 text-4xl font-bold">
              {goals.length}
            </h2>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <p className="text-slate-400">
              Completed
            </p>

            <h2 className="mt-2 text-4xl font-bold text-green-400">
              {completed}
            </h2>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <p className="text-slate-400">
              In Progress
            </p>

            <h2 className="mt-2 text-4xl font-bold text-cyan-400">
              {inProgress}
            </h2>
          </div>
        </div>

        {/* Overall Progress */}

        <div className="mt-8 rounded-2xl bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Overall Learning Progress
            </h2>

            <span className="text-cyan-300 font-medium">
              {progressPercentage}%
            </span>
          </div>

          <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full bg-cyan-500 transition-all"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        </div>

        {/* Goal Progress */}

        <div className="mt-8 rounded-2xl bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">
            Goal Breakdown
          </h2>

          <div className="mt-6 space-y-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-xl border border-slate-700 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {goal.topic}
                    </h3>

                    <p className="text-sm text-slate-400">
                      {goal.current_level} → {goal.target_level}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-sm ${
                      goal.status?.toLowerCase() === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : goal.status?.toLowerCase() === "in progress"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {goal.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {goals.length === 0 && (
            <p className="mt-4 text-slate-400">
              No learning goals found.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}