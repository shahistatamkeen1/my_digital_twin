"use client";

import { apiFetch } from "@/lib/api";

import { useEffect, useMemo, useState } from "react";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGoals = async () => {
    setError("");

    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning/`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("Could not load learning progress.");
      }

      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error("Learning progress error:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load learning progress."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchGoals();
  }, []);

  const metrics = useMemo(() => {
    const completed = goals.filter(
      (goal) => goal.status?.toLowerCase() === "completed"
    ).length;

    const inProgress = goals.filter(
      (goal) => goal.status?.toLowerCase() === "in progress"
    ).length;

    const paused = goals.filter(
      (goal) => goal.status?.toLowerCase() === "paused"
    ).length;

    const percentage =
      goals.length > 0 ? Math.round((completed / goals.length) * 100) : 0;

    return {
      completed,
      inProgress,
      paused,
      percentage,
    };
  }, [goals]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
          Goal tracking
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Progress Tracker
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Monitor your learning journey, goal statuses, and overall skill
          completion.
        </p>
      </header>

      {error ? <ErrorNotice message={error} /> : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-xl border border-slate-800 bg-slate-900"
            />
          ))}
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="Total Goals"
            value={goals.length.toString()}
            icon="🎯"
          />

          <MetricCard
            label="Completed"
            value={metrics.completed.toString()}
            icon="✅"
            valueClassName="text-emerald-400"
          />

          <MetricCard
            label="In Progress"
            value={metrics.inProgress.toString()}
            icon="📘"
            valueClassName="text-cyan-400"
          />

          <MetricCard
            label="Paused"
            value={metrics.paused.toString()}
            icon="⏸️"
            valueClassName="text-violet-300"
          />
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-cyan-300">
              Goal completion
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Overall Learning Progress
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Completed goals divided by all saved learning goals.
            </p>
          </div>

          <p className="text-3xl font-bold text-cyan-400">
            {metrics.percentage}%
          </p>
        </div>

        <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
            style={{ width: `${metrics.percentage}%` }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-white">Goal Breakdown</h2>

        <p className="mt-2 text-sm text-slate-400">
          Review the current level, target level, category, and status of each
          goal.
        </p>

        {loading ? (
          <div className="mt-5 space-y-4">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-xl bg-slate-800"
              />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-5 space-y-4">
            {goals.map((goal) => (
              <article
                key={goal.id}
                className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-cyan-300">
                      {goal.category || "Learning Goal"}
                    </p>

                    <h3 className="mt-1 break-words text-lg font-semibold text-white">
                      {goal.topic}
                    </h3>

                    <p className="mt-2 text-sm text-slate-400">
                      {goal.current_level || "Not set"} →{" "}
                      {goal.target_level || "Not set"}
                    </p>
                  </div>

                  <StatusBadge status={goal.status} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  icon: string;
  valueClassName?: string;
}) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400 sm:text-sm">{label}</p>
        <span aria-hidden="true">{icon}</span>
      </div>

      <p className={`mt-3 text-2xl font-bold sm:text-3xl ${valueClassName}`}>
        {value}
      </p>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase();

  const className =
    normalized === "completed"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : normalized === "in progress"
        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
        : normalized === "paused"
          ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-300";

  return (
    <span
      className={`w-full rounded-full border px-3 py-2 text-center text-xs sm:w-auto sm:py-1 ${className}`}
    >
      {status || "Not Started"}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/30 p-8 text-center">
      <p className="font-medium text-white">No learning goals found</p>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        Add goals in Learning Memory to begin tracking progress.
      </p>
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
      {message}
    </div>
  );
}
