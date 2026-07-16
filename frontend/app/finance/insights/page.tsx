"use client";

import { useState } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "detail" in payload
        ? String(payload.detail)
        : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload as T;
}

export default function FinanceInsightsPage() {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateInsight = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/finance/insight`, {
        cache: "no-store",
      });
      const data = await readJson<{ insight?: string }>(response);
      setInsight(data.insight?.trim() || "No recommendation was generated.");
    } catch (insightError) {
      setError(
        insightError instanceof Error
          ? insightError.message
          : "Could not generate a finance insight."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-400">
          AI Guidance
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          AI Finance Insights
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Generate personalized suggestions from your income, expenses,
          savings goals, Finance Memory, and spending behavior.
        </p>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="border-b border-slate-800 bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-300">
                Finance Twin Analysis
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Turn your financial activity into clear next steps
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                For the best result, first add transactions, define savings
                goals, and complete Finance Memory.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void generateInsight()}
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyzing Finances..." : "Generate Finance Insight"}
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          {loading ? (
            <div className="space-y-3">
              <div className="h-5 w-2/3 animate-pulse rounded bg-slate-800" />
              <div className="h-5 w-full animate-pulse rounded bg-slate-800" />
              <div className="h-5 w-5/6 animate-pulse rounded bg-slate-800" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-slate-800" />
            </div>
          ) : insight ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-xl">
                  ✨
                </span>
                <div>
                  <p className="text-sm font-semibold text-emerald-300">
                    Finance Twin Recommendation
                  </p>
                  <p className="text-xs text-slate-500">
                    Generated from your saved financial context
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-emerald-500/15 pt-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200 sm:text-base">
                  {insight}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
              <p className="font-medium text-white">
                No insight generated yet
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Click the button above when you are ready. Finance Twin will
                review your stored financial information and return a
                personalized recommendation.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InformationCard
          title="Transactions"
          text="Income and expense history helps identify cash-flow and spending patterns."
        />
        <InformationCard
          title="Savings Goals"
          text="Your active targets help the insight focus on the financial outcomes that matter."
        />
        <InformationCard
          title="Finance Memory"
          text="Risk comfort, budget preference, and personal notes improve personalization."
        />
      </section>
    </div>
  );
}

function InformationCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </article>
  );
}
