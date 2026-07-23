"use client";

import { apiFetch } from "@/lib/api";

import Link from "next/link";
import { useEffect, useState } from "react";

type LearningItem = {
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

type ProgressTask = {
  id: number;
  topic: string;
  task: string;
  completed: boolean;
};

type ProgressSummary = {
  total_tasks: number;
  completed_tasks: number;
  remaining_tasks: number;
  progress_percentage: number;
};

const initialProgressSummary: ProgressSummary = {
  total_tasks: 0,
  completed_tasks: 0,
  remaining_tasks: 0,
  progress_percentage: 0,
};

export default function LearningDashboardPage() {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [progressTasks, setProgressTasks] = useState<ProgressTask[]>([]);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary>(
    initialProgressSummary
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [itemsResponse, progressResponse] = await Promise.all([
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/learning/`, {
          cache: "no-store",
        }),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/learning-progress/`, {
          cache: "no-store",
        }),
      ]);

      if (!itemsResponse.ok) {
        throw new Error("Could not load your learning goals.");
      }

      if (!progressResponse.ok) {
        throw new Error("Could not load your learning progress.");
      }

      const [itemsData, progressData] = await Promise.all([
        itemsResponse.json(),
        progressResponse.json(),
      ]);

      setItems(Array.isArray(itemsData) ? itemsData : []);
      setProgressTasks(
        Array.isArray(progressData.tasks) ? progressData.tasks : []
      );

      const summary = progressData.summary || initialProgressSummary;

      setProgressSummary({
        total_tasks: Number(summary.total_tasks || 0),
        completed_tasks: Number(summary.completed_tasks || 0),
        remaining_tasks: Number(summary.remaining_tasks || 0),
        progress_percentage: clampPercentage(
          Number(summary.progress_percentage || 0)
        ),
      });
    } catch (loadError) {
      console.error("Learning dashboard error:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load the Learning Dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const activeGoals = items.filter(
    (item) => item.status?.toLowerCase() === "in progress"
  ).length;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
          Learning command center
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Learning Twin Dashboard
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Manage learning goals, track progress, generate roadmaps, and decide
          what to study next.
        </p>
      </header>

      {error ? <ErrorNotice message={error} /> : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900"
            />
          ))}
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Learning Goals"
            value={items.length.toString()}
            helper={`${activeGoals} currently active`}
            icon="🎯"
          />

          <StatCard
            label="Completed Tasks"
            value={progressSummary.completed_tasks.toString()}
            helper={`${progressSummary.total_tasks} total tasks`}
            icon="✅"
            valueClassName="text-emerald-400"
          />

          <StatCard
            label="Remaining Tasks"
            value={progressSummary.remaining_tasks.toString()}
            helper={`${progressTasks.length} tasks loaded`}
            icon="📝"
            valueClassName="text-amber-300"
          />

          <StatCard
            label="Progress"
            value={`${progressSummary.progress_percentage}%`}
            helper="Overall task completion"
            icon="📈"
            valueClassName="text-cyan-400"
          />
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-cyan-300">
              Overall completion
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Learning Progress
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Progress is calculated from your generated learning tasks.
            </p>
          </div>

          <p className="text-3xl font-bold text-cyan-400">
            {progressSummary.progress_percentage}%
          </p>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
            style={{ width: `${progressSummary.progress_percentage}%` }}
          />
        </div>
      </section>

      <section>
        <div>
          <p className="text-xs font-medium text-cyan-300">Quick actions</p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Continue Learning
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            title="Learning Memory"
            description="Add and manage skills, certifications, topics, and saved resources."
            href="/learning/memory"
            icon="🧠"
          />

          <QuickAction
            title="AI Roadmap"
            description="Generate a structured study roadmap from your saved learning goals."
            href="/learning/roadmap"
            icon="🗺️"
          />

          <QuickAction
            title="Resources"
            description="Review the courses, websites, and materials attached to your goals."
            href="/learning/resources"
            icon="📚"
          />

          <QuickAction
            title="Next Task"
            description="Get one focused AI-recommended learning task for today."
            href="/learning/next-task"
            icon="🚀"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Recent Learning Goals
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Your latest saved goals and skill targets.
            </p>
          </div>

          <Link
            href="/learning/memory"
            className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
          >
            Manage all goals →
          </Link>
        </div>

        {loading ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-xl bg-slate-800"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No learning goals added yet"
            description="Open Learning Memory and add the first skill or certification you want to develop."
          />
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.slice(0, 6).map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-700 bg-slate-800/70 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-cyan-300">
                      {item.category || "Learning Goal"}
                    </p>

                    <h3 className="mt-2 break-words text-lg font-semibold text-white">
                      {item.topic}
                    </h3>
                  </div>

                  <StatusBadge status={item.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <LevelCard label="Current" value={item.current_level} />
                  <LevelCard label="Target" value={item.target_level} />
                </div>

                {item.notes ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">
                    {item.notes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon,
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  helper: string;
  icon: string;
  valueClassName?: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-slate-400 sm:text-sm">{label}</p>
        <span aria-hidden="true">{icon}</span>
      </div>

      <p className={`mt-3 text-2xl font-bold sm:text-3xl ${valueClassName}`}>
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
    </article>
  );
}

function QuickAction({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-0.5 hover:border-cyan-500/40 hover:bg-slate-800"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-lg">
        {icon}
      </div>

      <h3 className="mt-4 font-semibold text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>

      <p className="mt-4 text-sm font-medium text-cyan-300 transition group-hover:text-cyan-200">
        Open →
      </p>
    </Link>
  );
}

function LevelCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-950/60 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-white">{value || "Not set"}</p>
    </div>
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
      className={`shrink-0 rounded-full border px-3 py-1 text-xs ${className}`}
    >
      {status || "Not Started"}
    </span>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/30 p-8 text-center">
      <p className="font-medium text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
        {description}
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

function clampPercentage(value: number) {
  return Math.max(0, Math.min(Math.round(value), 100));
}
