"use client";

import { apiFetch } from "@/lib/api";

import { useEffect, useState } from "react";
import HealthInsightResponse from "../components/HealthInsightResponse";

type HealthSummary = {
  avg_water: number;
  avg_sleep: number;
  avg_workout: number;
  wellness_score: number;
  habit_count: number;
  water_goal: number;
  sleep_goal: number;
  workout_goal: number;
};

const initialSummary: HealthSummary = {
  avg_water: 0,
  avg_sleep: 0,
  avg_workout: 0,
  wellness_score: 0,
  habit_count: 0,
  water_goal: 8,
  sleep_goal: 8,
  workout_goal: 30,
};

export default function HealthDashboardPage() {
  const [summary, setSummary] = useState<HealthSummary>(initialSummary);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [insight, setInsight] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [insightError, setInsightError] = useState("");

  const fetchSummary = async () => {
    setSummaryError("");

    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/health/summary`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("Could not load your wellness summary.");
      }

      const data = await res.json();

      setSummary({
        avg_water: Number(data.avg_water || 0),
        avg_sleep: Number(data.avg_sleep || 0),
        avg_workout: Number(data.avg_workout || 0),
        wellness_score: Number(data.wellness_score || 0),
        habit_count: Number(data.habit_count || 0),
        water_goal: Number(data.water_goal || 8),
        sleep_goal: Number(data.sleep_goal || 8),
        workout_goal: Number(data.workout_goal || 30),
      });
    } catch (error) {
      console.error("Could not load health summary:", error);
      setSummaryError(
        error instanceof Error
          ? error.message
          : "Could not load your wellness summary."
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  const generateInsight = async () => {
    setLoadingInsight(true);
    setInsightError("");

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
    } catch (error) {
      console.error("Health insight error:", error);
      setInsightError(
        error instanceof Error
          ? error.message
          : "Could not generate your health insight."
      );
    } finally {
      setLoadingInsight(false);
    }
  };

  useEffect(() => {
    void fetchSummary();
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">
          Wellness overview
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Health Twin Dashboard
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
          Your wellness overview based on daily habits and Health Memory.
        </p>
      </header>

      {summaryError ? (
        <ErrorNotice message={summaryError} />
      ) : null}

      {loadingSummary ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl border border-slate-800 bg-slate-900"
            />
          ))}
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="Avg Water"
            value={`${summary.avg_water} cups`}
            helper={`Goal: ${summary.water_goal} cups`}
            icon="💧"
          />
          <MetricCard
            label="Avg Sleep"
            value={`${summary.avg_sleep} hrs`}
            helper={`Goal: ${summary.sleep_goal} hrs`}
            icon="🌙"
          />
          <MetricCard
            label="Avg Workout"
            value={`${summary.avg_workout} min`}
            helper={`Goal: ${summary.workout_goal} min`}
            icon="🏃"
            valueClassName="text-emerald-400"
          />
          <MetricCard
            label="Wellness Score"
            value={`${clamp(summary.wellness_score)}%`}
            helper={`Based on ${summary.habit_count} entries`}
            icon="❤️"
            valueClassName="text-rose-400"
          />
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-rose-300">
            Daily goal progress
          </p>
          <h2 className="text-xl font-semibold text-white">Health Progress</h2>
          <p className="text-sm leading-6 text-slate-400">
            Compare your recent averages with the goals stored in Health Memory.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <ProgressBar
            label="Water Goal"
            value={summary.avg_water}
            goal={summary.water_goal}
            suffix="cups"
            barClassName="from-cyan-500 to-blue-500"
          />
          <ProgressBar
            label="Sleep Goal"
            value={summary.avg_sleep}
            goal={summary.sleep_goal}
            suffix="hrs"
            barClassName="from-violet-500 to-indigo-500"
          />
          <ProgressBar
            label="Workout Goal"
            value={summary.avg_workout}
            goal={summary.workout_goal}
            suffix="min"
            barClassName="from-emerald-500 to-teal-500"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex flex-col gap-5 border-b border-slate-800 bg-gradient-to-r from-rose-500/[0.08] to-pink-500/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-medium text-rose-300">
              Health Twin Analysis
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Convert your habits into practical wellness steps
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Your response is organized into assessment, positives, concerns,
              and clear action cards.
            </p>
          </div>

          <button
            type="button"
            onClick={generateInsight}
            disabled={loadingInsight}
            className="w-full shrink-0 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loadingInsight ? "Analyzing..." : "Generate Health Insight"}
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {insightError ? <ErrorNotice message={insightError} /> : null}

          {loadingInsight ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/40"
                />
              ))}
            </div>
          ) : insight ? (
            <HealthInsightResponse content={insight} compact />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-2xl">
                ✨
              </div>
              <h3 className="mt-4 font-semibold text-white">
                Your personalized wellness analysis will appear here
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Add daily habits and complete Health Memory for a more useful
                recommendation.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
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
        <span aria-hidden="true" className="text-lg">
          {icon}
        </span>
      </div>
      <h2
        className={`mt-3 break-words text-2xl font-bold sm:text-3xl ${valueClassName}`}
      >
        {value}
      </h2>
      <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
    </article>
  );
}

function ProgressBar({
  label,
  value,
  goal,
  suffix,
  barClassName,
}: {
  label: string;
  value: number;
  goal: number;
  suffix: string;
  barClassName: string;
}) {
  const percent =
    goal > 0 ? Math.min(Math.round((value / goal) * 100), 100) : 0;

  return (
    <div>
      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-white">{label}</span>
        <span className="text-slate-400">
          {value} / {goal} {suffix} · {percent}%
        </span>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barClassName}`}
          style={{ width: `${percent}%` }}
        />
      </div>
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

function clamp(value: number) {
  return Math.max(0, Math.min(Math.round(value), 100));
}
