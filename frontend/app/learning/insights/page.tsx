"use client";

import { apiFetch } from "@/lib/api";

import { useState } from "react";

type InsightData = {
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  next_focus: string;
};

export default function LearningInsightsPage() {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateInsights = async () => {
    setLoading(true);
    setInsights(null);
    setError("");

    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning-chat/insights`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("Learning Twin could not generate insights.");
      }

      const data = await res.json();
      const result = data.insights;

      if (!result) {
        throw new Error("No learning insights were returned.");
      }

      setInsights({
        summary: result.summary || "",
        strengths: Array.isArray(result.strengths) ? result.strengths : [],
        gaps: Array.isArray(result.gaps) ? result.gaps : [],
        recommendations: Array.isArray(result.recommendations)
          ? result.recommendations
          : [],
        next_focus: result.next_focus || "",
      });
    } catch (requestError) {
      console.error("Learning insight error:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not generate learning insights."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
          AI skill guidance
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Learning Insights
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Analyze your learning direction and receive clear guidance on
          strengths, gaps, recommendations, and what to focus on next.
        </p>
      </header>

      {error ? <ErrorNotice message={error} /> : null}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex flex-col gap-5 border-b border-slate-800 bg-gradient-to-r from-cyan-500/[0.08] to-blue-500/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-medium text-cyan-300">
              Learning Twin analysis
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Turn your goals into a clear learning strategy
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Results are separated into readable cards instead of a long AI
              response.
            </p>
          </div>

          <button
            type="button"
            onClick={generateInsights}
            disabled={loading}
            className="w-full shrink-0 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? "Analyzing..." : "Generate Insights"}
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {loading ? (
            <InsightsSkeleton />
          ) : insights ? (
            <div className="space-y-5">
              <section className="rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.05] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15">
                    🧠
                  </span>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">
                      Summary
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-white">
                      Current Learning Direction
                    </h3>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {insights.summary || "No summary was generated."}
                </p>
              </section>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <ListCard
                  title="Strengths"
                  subtitle="What is currently supporting your progress."
                  items={insights.strengths}
                  icon="✅"
                  tone="emerald"
                />

                <ListCard
                  title="Skill Gaps"
                  subtitle="Areas that may slow down your target outcome."
                  items={insights.gaps}
                  icon="⚠️"
                  tone="amber"
                />
              </div>

              <ListCard
                title="Recommendations"
                subtitle="Practical improvements you can apply to your learning plan."
                items={insights.recommendations}
                icon="🚀"
                tone="violet"
                columns
              />

              <section className="rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-cyan-500/[0.08] to-blue-500/[0.04] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15">
                    🎯
                  </span>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">
                      Next Focus
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-white">
                      Your Most Important Next Priority
                    </h3>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-200">
                  {insights.next_focus || "No next focus was generated."}
                </p>
              </section>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>
    </div>
  );
}

function ListCard({
  title,
  subtitle,
  items,
  icon,
  tone,
  columns = false,
}: {
  title: string;
  subtitle: string;
  items: string[];
  icon: string;
  tone: "emerald" | "amber" | "violet";
  columns?: boolean;
}) {
  const styles = {
    emerald:
      "border-emerald-500/25 bg-emerald-500/[0.05] text-emerald-300",
    amber: "border-amber-500/25 bg-amber-500/[0.05] text-amber-300",
    violet:
      "border-violet-500/25 bg-violet-500/[0.05] text-violet-300",
  }[tone];

  return (
    <section className={`rounded-2xl border p-5 sm:p-6 ${styles}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950/30">
          {icon}
        </span>

        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>
        </div>
      </div>

      {items.length > 0 ? (
        <div
          className={`mt-5 grid grid-cols-1 gap-3 ${
            columns ? "md:grid-cols-2" : ""
          }`}
        >
          {items.map((item, index) => (
            <article
              key={`${item}-${index}`}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-bold text-cyan-300">
                {index + 1}
              </span>

              <p className="text-sm leading-6 text-slate-300">{item}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-400">
          No items were generated for this section.
        </p>
      )}
    </section>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-44 animate-pulse rounded-2xl bg-slate-950/40" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-950/40" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-950/40" />
      </div>

      <div className="h-56 animate-pulse rounded-2xl bg-slate-950/40" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-2xl">
        ✨
      </div>

      <h3 className="mt-4 text-lg font-semibold text-white">
        Generate your learning analysis
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
        The Learning Twin will review your saved goals and organize the results
        into clear, actionable cards.
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
