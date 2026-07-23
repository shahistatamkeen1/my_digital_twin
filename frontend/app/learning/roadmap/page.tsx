"use client";

import { apiFetch } from "@/lib/api";

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
  const [error, setError] = useState("");

  const generateRoadmap = async () => {
    setLoading(true);
    setSteps([]);
    setError("");

    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning-chat/roadmap`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("Learning Twin could not generate the roadmap.");
      }

      const data = await res.json();

      if (!Array.isArray(data.roadmap)) {
        throw new Error(
          "The roadmap response is not a valid JSON array. Update the backend roadmap response format."
        );
      }

      setSteps(
        data.roadmap.map((step: Partial<RoadmapStep>) => ({
          title: step.title || "Learning Step",
          goal: step.goal || "",
          why: step.why || "",
          actions: Array.isArray(step.actions) ? step.actions : [],
        }))
      );
    } catch (requestError) {
      console.error("Roadmap generation error:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not generate the learning roadmap."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
          AI study planning
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          AI Learning Roadmap
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Generate a structured learning roadmap based on your saved goals,
          current level, and target outcomes.
        </p>
      </header>

      {error ? <ErrorNotice message={error} /> : null}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex flex-col gap-5 border-b border-slate-800 bg-gradient-to-r from-cyan-500/[0.08] to-blue-500/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-medium text-cyan-300">
              Personalized study plan
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Build a clear path from your current level to your goal
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Each step includes a learning goal, why it matters, and practical
              actions.
            </p>
          </div>

          <button
            type="button"
            onClick={generateRoadmap}
            disabled={loading}
            className="w-full shrink-0 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? "Generating..." : "Generate Roadmap"}
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {loading ? (
            <RoadmapSkeleton />
          ) : steps.length > 0 ? (
            <div className="space-y-5">
              {steps.map((step, index) => (
                <article
                  key={`${step.title}-${index}`}
                  className="rounded-2xl border border-cyan-500/20 bg-slate-950/50 p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <span className="inline-flex w-fit rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-medium text-cyan-300">
                      Step {index + 1}
                    </span>

                    <h3 className="text-xl font-semibold text-white">
                      {step.title}
                    </h3>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <InformationCard
                      title="Learning Goal"
                      text={step.goal}
                      icon="📚"
                      tone="cyan"
                    />

                    <InformationCard
                      title="Why It Matters"
                      text={step.why}
                      icon="💡"
                      tone="violet"
                    />
                  </div>

                  <section className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true">✅</span>
                      <h4 className="font-semibold text-emerald-300">
                        Action Items
                      </h4>
                    </div>

                    {step.actions.length > 0 ? (
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {step.actions.map((action, actionIndex) => (
                          <div
                            key={`${action}-${actionIndex}`}
                            className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-4"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-bold text-cyan-300">
                              {actionIndex + 1}
                            </span>

                            <p className="text-sm leading-6 text-slate-300">
                              {action}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-400">
                        No action items were generated for this step.
                      </p>
                    )}
                  </section>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>
    </div>
  );
}

function InformationCard({
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

function RoadmapSkeleton() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/40"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-2xl">
        🗺️
      </div>

      <h3 className="mt-4 text-lg font-semibold text-white">
        Generate your learning roadmap
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
        Add learning goals in Learning Memory first, then generate a
        personalized plan.
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
