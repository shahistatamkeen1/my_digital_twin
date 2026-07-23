"use client";

import { apiFetch } from "@/lib/api";

import { useState } from "react";
import HealthInsightResponse from "../components/HealthInsightResponse";

export default function HealthInsightsPage() {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateInsight = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/health/insight`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("Health Twin could not generate an insight.");
      }

      const data = await res.json();
      setInsight(data.insight || "No insight was generated.");
    } catch (requestError) {
      console.error("Health insight error:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not generate your health insight."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">
          AI Guidance
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          AI Health Insights
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Generate personalized wellness suggestions from Health Memory, daily
          habits, goals, and recent wellness patterns.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex flex-col gap-5 border-b border-slate-800 bg-gradient-to-r from-rose-500/[0.08] to-pink-500/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-medium text-rose-300">
              Health Twin Analysis
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Turn your wellness history into clear next steps
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              For the best result, complete Health Memory and record several
              daily habit entries first.
            </p>
          </div>

          <button
            type="button"
            onClick={generateInsight}
            disabled={loading}
            className="w-full shrink-0 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? "Analyzing..." : "Generate Health Insight"}
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {error ? (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-44 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/40"
                />
              ))}
            </div>
          ) : insight ? (
            <HealthInsightResponse content={insight} />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-2xl">
                ✨
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">
                Generate your first wellness analysis
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Health Twin will organize the response into readable cards
                rather than displaying raw AI text.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ContextCard
          title="Health Memory"
          description="Goals, diet preferences, restrictions, and daily targets improve personalization."
        />
        <ContextCard
          title="Daily Habits"
          description="Water, sleep, workout, and mood history helps identify wellness patterns."
        />
        <ContextCard
          title="Diet Planner"
          description="Your nutrition plan can use the same saved wellness and lifestyle context."
        />
      </section>
    </div>
  );
}

function ContextCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );
}
