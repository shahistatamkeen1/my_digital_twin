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
  const [error, setError] = useState("");

  const generateTask = async () => {
    setLoading(true);
    setTask(null);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning-chat/next-task`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("Learning Twin could not generate the next task.");
      }

      const data = await res.json();

      if (!data.task) {
        throw new Error("No task was returned by the Learning Twin.");
      }

      setTask({
        title: data.task.title || "Today's Learning Task",
        reason: data.task.reason || "",
        time_needed: data.task.time_needed || "Not specified",
        steps: Array.isArray(data.task.steps) ? data.task.steps : [],
      });
    } catch (requestError) {
      console.error("Next task error:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not generate the next learning task."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
          Daily learning focus
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Next Task
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Get one focused AI-recommended task for today based on your learning
          goals and progress.
        </p>
      </header>

      {error ? <ErrorNotice message={error} /> : null}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex flex-col gap-5 border-b border-slate-800 bg-gradient-to-r from-cyan-500/[0.08] to-blue-500/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-medium text-cyan-300">
              Today's focused action
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Generate one realistic task you can finish today
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              The recommendation includes why it matters, estimated time, and
              clear completion steps.
            </p>
          </div>

          <button
            type="button"
            onClick={generateTask}
            disabled={loading}
            className="w-full shrink-0 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? "Generating..." : "Generate Next Task"}
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="h-96 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/40" />
          ) : task ? (
            <article className="rounded-2xl border border-cyan-500/25 bg-slate-950/50 p-5 sm:p-6">
              <span className="inline-flex rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-medium text-cyan-300">
                Recommended Task
              </span>

              <h3 className="mt-4 text-2xl font-bold text-white">
                {task.title}
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoCard
                  title="Why This Task"
                  text={task.reason}
                  icon="💡"
                  tone="violet"
                />

                <InfoCard
                  title="Time Needed"
                  text={task.time_needed}
                  icon="⏱️"
                  tone="cyan"
                />
              </div>

              <section className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true">✅</span>
                  <h4 className="font-semibold text-emerald-300">
                    Steps to Complete
                  </h4>
                </div>

                {task.steps.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {task.steps.map((step, index) => (
                      <div
                        key={`${step}-${index}`}
                        className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-4"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-bold text-cyan-300">
                          {index + 1}
                        </span>

                        <p className="text-sm leading-6 text-slate-300">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">
                    No completion steps were generated.
                  </p>
                )}
              </section>
            </article>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  title,
  text,
  icon,
  tone,
}: {
  title: string;
  text: string;
  icon: string;
  tone: "cyan" | "violet";
}) {
  const styles =
    tone === "cyan"
      ? "border-cyan-500/20 bg-cyan-500/[0.05] text-cyan-300"
      : "border-violet-500/20 bg-violet-500/[0.05] text-violet-300";

  return (
    <section className={`rounded-xl border p-4 sm:p-5 ${styles}`}>
      <div className="flex items-center gap-3">
        <span aria-hidden="true">{icon}</span>
        <h4 className="font-semibold">{title}</h4>
      </div>

      <p className="mt-3 text-sm leading-7 text-slate-300">
        {text || "No details were generated."}
      </p>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-2xl">
        🚀
      </div>

      <h3 className="mt-4 text-lg font-semibold text-white">
        Generate today's learning focus
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
        The Learning Twin will use your saved goals and progress to choose one
        practical task.
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
