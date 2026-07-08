"use client";

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

  const generateInsights = async () => {
    setLoading(true);
    setInsights(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning-chat/insights`
      );

      const data = await res.json();
      setInsights(data.insights || null);
    } catch (error) {
      console.error(error);
      alert("Could not generate learning insights.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-cyan-300">Learning Twin</p>

        <h1 className="mt-2 text-4xl font-bold">Learning Insights</h1>

        <p className="mt-3 max-w-3xl text-slate-400">
          Analyze your learning goals and get AI-powered guidance on strengths,
          gaps, and what to focus on next.
        </p>

        <section className="mt-8 rounded-2xl bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">AI Skill Analysis</h2>
              <p className="mt-2 text-sm text-slate-400">
                Generate a clear analysis of your current learning direction.
              </p>
            </div>

            <button
              onClick={generateInsights}
              disabled={loading}
              className="rounded-lg bg-cyan-600 px-5 py-3 font-medium hover:bg-cyan-500 disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Generate Insights"}
            </button>
          </div>

          {insights && (
            <div className="mt-8 space-y-5">
              <div className="rounded-xl border border-cyan-500/30 bg-slate-950 p-6">
                <p className="text-sm font-semibold text-cyan-300">
                  🧠 Summary
                </p>
                <p className="mt-3 text-slate-300">{insights.summary}</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-xl bg-slate-950 p-6">
                  <p className="text-sm font-semibold text-emerald-300">
                    ✅ Strengths
                  </p>
                  <ul className="mt-3 space-y-2">
                    {insights.strengths.map((item, index) => (
                      <li key={index} className="text-slate-300">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl bg-slate-950 p-6">
                  <p className="text-sm font-semibold text-yellow-300">
                    ⚠️ Skill Gaps
                  </p>
                  <ul className="mt-3 space-y-2">
                    {insights.gaps.map((item, index) => (
                      <li key={index} className="text-slate-300">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 p-6">
                <p className="text-sm font-semibold text-violet-300">
                  🚀 Recommendations
                </p>
                <ul className="mt-3 space-y-2">
                  {insights.recommendations.map((item, index) => (
                    <li key={index} className="text-slate-300">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-6">
                <p className="text-sm font-semibold text-cyan-300">
                  🎯 Next Focus
                </p>
                <p className="mt-3 text-slate-200">{insights.next_focus}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}