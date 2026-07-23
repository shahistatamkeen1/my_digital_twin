"use client";

import { apiFetch } from "@/lib/api";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

type PredictiveInsight = {
  agent_name: string;
  metric: string;
  prediction_score: number;
  prediction: string;
  goals_detected: string[];
  risk_count: number;
  memory_count: number;
  active_plan_count: number;
};

type PredictiveResponse = {
  overall_prediction_score: number;
  summary: string;
  insights: PredictiveInsight[];
};

export default function PredictiveInsightsPage() {
  const [data, setData] = useState<PredictiveResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/predictive-insights/`
      );

      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Predictive insights error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div>
        <p className="text-sm text-cyan-300">Digital Twin Intelligence</p>

        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Predictive Insights
        </h1>

        <p className="mt-3 max-w-3xl text-slate-400">
          Forecasts generated from your agent memory, learned profiles, active
          plans, and risk signals.
        </p>

        {loading ? (
          <div className="mt-8 rounded-2xl bg-slate-900 p-8">
            Loading predictive insights...
          </div>
        ) : data ? (
          <>
            <section className="mt-8 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-5 sm:p-8">
              <p className="text-sm text-cyan-300">
                Overall Prediction Score
              </p>

              <h2 className="mt-3 text-5xl font-bold text-cyan-300 sm:text-6xl">
                {data.overall_prediction_score}%
              </h2>

              <p className="mt-4 max-w-4xl leading-7 text-slate-300">
                {data.summary}
              </p>
            </section>

            <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
              {data.insights.map((insight) => {
                const theme = getTheme(insight.agent_name);

                return (
                  <div
                    key={insight.agent_name}
                    className={`rounded-2xl border ${theme.border} ${theme.bg} p-5 sm:p-6`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-3xl">{theme.icon}</div>

                        <p className={`mt-3 text-sm ${theme.text}`}>
                          {insight.agent_name}
                        </p>

                        <h2 className="mt-2 text-2xl font-bold">
                          {insight.metric}
                        </h2>
                      </div>

                      <div className="rounded-2xl bg-slate-900 px-5 py-3 text-right">
                        <p className="text-xs text-slate-400">
                          Forecast
                        </p>
                        <h3 className={`text-3xl font-bold ${theme.text}`}>
                          {insight.prediction_score}%
                        </h3>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="h-3 rounded-full bg-slate-800">
                        <div
                          className="h-3 rounded-full bg-cyan-500"
                          style={{
                            width: `${insight.prediction_score}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl bg-slate-900 p-4">
                      <p className="text-sm text-cyan-300">
                        Prediction
                      </p>

                      <p className="mt-2 leading-6 text-slate-300">
                        {insight.prediction}
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <MiniStat
                        label="Memories"
                        value={insight.memory_count}
                      />

                      <MiniStat
                        label="Active Plans"
                        value={insight.active_plan_count}
                      />

                      <MiniStat
                        label="Risks"
                        value={insight.risk_count}
                      />
                    </div>

                    <div className="mt-5">
                      <p className={`text-sm font-medium ${theme.text}`}>
                        Goals Detected
                      </p>

                      {insight.goals_detected.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {insight.goals_detected.map((goal, index) => (
                            <span
                              key={index}
                              className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200"
                            >
                              {goal}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-400">
                          No strong goals detected yet.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        ) : (
          <div className="mt-8 rounded-2xl bg-slate-900 p-8 text-slate-400">
            No predictive insights available.
          </div>
        )}
      </div>
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-900 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-cyan-300">{value}</p>
    </div>
  );
}

function getTheme(agent: string) {
  if (agent.includes("Career")) {
    return {
      icon: "💼",
      border: "border-blue-500/30",
      bg: "bg-blue-500/5",
      text: "text-blue-300",
    };
  }

  if (agent.includes("Finance")) {
    return {
      icon: "💰",
      border: "border-green-500/30",
      bg: "bg-green-500/5",
      text: "text-green-300",
    };
  }

  if (agent.includes("Health")) {
    return {
      icon: "❤️",
      border: "border-pink-500/30",
      bg: "bg-pink-500/5",
      text: "text-pink-300",
    };
  }

  return {
    icon: "📚",
    border: "border-violet-500/30",
    bg: "bg-violet-500/5",
    text: "text-violet-300",
  };
}