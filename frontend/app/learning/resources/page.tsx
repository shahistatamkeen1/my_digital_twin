"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGoals = async () => {
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning/`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("Could not load learning resources.");
      }

      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error("Learning resource error:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load learning resources."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchGoals();
  }, []);

  const resourceGoals = useMemo(
    () => goals.filter((goal) => goal.resource || goal.resource_link),
    [goals]
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
          Saved study materials
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Learning Resources
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Review all courses, websites, books, videos, and materials connected
          to your learning goals.
        </p>
      </header>

      {error ? <ErrorNotice message={error} /> : null}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <ResourceMetric
          label="Saved Goals"
          value={goals.length.toString()}
          icon="🎯"
        />

        <ResourceMetric
          label="Resources"
          value={resourceGoals.length.toString()}
          icon="📚"
        />

        <ResourceMetric
          label="With Links"
          value={resourceGoals
            .filter((goal) => Boolean(goal.resource_link))
            .length.toString()}
          icon="🔗"
          fullWidthOnMobile
        />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Saved Resources</h2>

          <p className="mt-2 text-sm text-slate-400">
            Resource links are visually highlighted and open in a new tab.
          </p>
        </div>

        {loading ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-xl bg-slate-800"
              />
            ))}
          </div>
        ) : resourceGoals.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resourceGoals.map((goal) => (
              <article
                key={goal.id}
                className="flex h-full flex-col rounded-xl border border-cyan-500/20 bg-slate-950/50 p-5"
              >
                <p className="text-xs font-medium text-cyan-300">
                  {goal.category || "Learning Resource"}
                </p>

                <h3 className="mt-2 break-words text-lg font-semibold text-white">
                  {goal.topic}
                </h3>

                <p className="mt-3 text-sm text-slate-400">
                  {goal.current_level || "Not set"} →{" "}
                  {goal.target_level || "Not set"}
                </p>

                <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Resource
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-200">
                    {goal.resource || "Saved resource link"}
                  </p>
                </div>

                {goal.notes ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">
                    {goal.notes}
                  </p>
                ) : null}

                {goal.resource_link ? (
                  <a
                    href={goal.resource_link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:border-amber-300/60 hover:bg-amber-400/15 hover:text-amber-200"
                  >
                    Open Resource ↗
                  </a>
                ) : (
                  <p className="mt-5 rounded-xl border border-dashed border-slate-700 px-4 py-3 text-center text-sm text-slate-500">
                    No URL saved
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ResourceMetric({
  label,
  value,
  icon,
  fullWidthOnMobile = false,
}: {
  label: string;
  value: string;
  icon: string;
  fullWidthOnMobile?: boolean;
}) {
  return (
    <article
      className={`rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5 ${
        fullWidthOnMobile ? "col-span-2 sm:col-span-1" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-400 sm:text-sm">{label}</p>
        <span aria-hidden="true">{icon}</span>
      </div>

      <p className="mt-2 text-2xl font-bold text-cyan-400 sm:text-3xl">
        {value}
      </p>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/30 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-xl">
        📚
      </div>

      <h3 className="mt-4 font-semibold text-white">
        No learning resources found
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
        Add a resource name or URL to an item in Learning Memory.
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
