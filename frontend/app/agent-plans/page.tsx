"use client";

import { apiFetch } from "@/lib/api";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";

type AgentPlan = {
  id: number;
  agent_name: string;
  plan_type: string;
  title: string;
  goal: string;
  tasks: string[];
  completed_tasks: number[];
  risks: string[];
  success_metric: string;
  status: string;
  completion_percent: number;
  created_at: string;
};

export default function AgentPlansPage() {
  const [plans, setPlans] = useState<AgentPlan[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agent-plans/`
      );
      const data = await res.json();
      setPlans(data);

      const weeklyRes = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agent-plans/executive-weekly`
      );
      const weeklyData = await weeklyRes.json();
      setWeeklyPlan(weeklyData);
    } catch (error) {
      console.error("Plans error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlans = async () => {
    setLoading(true);

    try {
      await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agent-plans/generate`,
        {
          method: "POST",
        }
      );

      await loadPlans();
    } catch (error) {
      console.error("Generate plans error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (planId: number, taskIndex: number) => {
    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agent-plans/${planId}/toggle-task/${taskIndex}`,
        {
          method: "POST",
        }
      );

      const updatedPlan = await res.json();

      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === updatedPlan.id ? updatedPlan : plan
        )
      );

      await loadPlans();
    } catch (error) {
      console.error("Toggle task error:", error);
    }
  };

  return (
    <AppShell>
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-cyan-300">
              Digital Twin Intelligence
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Autonomous Planning
            </h1>

            <p className="mt-3 max-w-3xl text-slate-400">
              Personalized plans created from your memories, learned profile,
              risks, goals, and progress.
            </p>
          </div>

          <button
            onClick={generatePlans}
            className="rounded-lg bg-cyan-600 px-5 py-3 font-medium hover:bg-cyan-500"
          >
            Generate Plans
          </button>
        </div>

        {weeklyPlan && (
          <section className="mt-8 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">
            <p className="text-sm text-cyan-300">
              Executive Weekly Plan
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {weeklyPlan.title}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              {weeklyPlan.summary}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {weeklyPlan.tasks?.map((item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-xl bg-slate-900 p-4 text-sm text-slate-300"
                >
                  <p className="text-cyan-300">{item.agent_name}</p>
                  <p className="mt-2">{item.task}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl bg-slate-900 p-8">
            Loading plans...
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {plans.map((plan) => {
              const theme = getTheme(plan.agent_name);

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border ${theme.border} ${theme.bg} p-5 sm:p-6`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-3xl">{theme.icon}</div>

                      <p className={`mt-3 text-sm ${theme.text}`}>
                        {plan.agent_name}
                      </p>

                      <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                        {plan.title}
                      </h2>
                    </div>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {plan.status}
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Completion</span>
                      <span className={theme.text}>
                        {plan.completion_percent}%
                      </span>
                    </div>

                    <div className="mt-2 h-3 rounded-full bg-slate-800">
                      <div
                        className="h-3 rounded-full bg-cyan-500"
                        style={{ width: `${plan.completion_percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl bg-slate-900 p-4">
                    <p className="text-sm text-cyan-300">Goal</p>
                    <p className="mt-2 text-slate-300">{plan.goal}</p>
                  </div>

                  <div className="mt-5">
                    <p className={`text-sm font-medium ${theme.text}`}>
                      7-Day Action Plan
                    </p>

                    <ul className="mt-3 space-y-3">
                      {plan.tasks.map((task, index) => {
                        const completed =
                          plan.completed_tasks?.includes(index);

                        return (
                          <li
                            key={index}
                            className="flex items-start gap-3 rounded-xl bg-slate-900 p-3 text-sm text-slate-300 sm:p-4"
                          >
                            <button
                              onClick={() => toggleTask(plan.id, index)}
                              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                completed
                                  ? "border-green-400 bg-green-500 text-white"
                                  : "border-slate-500"
                              }`}
                            >
                              {completed ? "✓" : ""}
                            </button>

                            <span
                              className={
                                completed
                                  ? "text-slate-500 line-through"
                                  : ""
                              }
                            >
                              {task}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-medium text-yellow-300">
                      Risks to Watch
                    </p>

                    {plan.risks.length ? (
                      <ul className="mt-3 space-y-2 text-sm text-slate-300">
                        {plan.risks.map((risk, index) => (
                          <li key={index}>⚠️ {risk}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">
                        No major risks detected.
                      </p>
                    )}
                  </div>

                  <div className="mt-5 rounded-xl bg-slate-900 p-4">
                    <p className="text-sm text-green-300">
                      Success Metric
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {plan.success_metric}
                    </p>
                  </div>
                </div>
              );
            })}

            {plans.length === 0 && (
              <div className="rounded-2xl bg-slate-900 p-8 text-slate-400">
                No plans yet. Click Generate Plans.
              </div>
            )}
          </div>
        )}
         </div>
  </AppShell>
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