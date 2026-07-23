"use client";

import { apiFetch } from "@/lib/api";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

type AgentMemory = {
  id: number;
  agent_name: string;
  insight_type: string;
  summary: string;
  recommendation: string[];
  risks: string[];
  confidence: number;
  source_question: string;
  created_at: string;
};

export default function AgentMemoryPage() {
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agent-memory/`
      );

      const data = await res.json();

      setMemories(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getAgentColor = (agent: string) => {
    if (agent.includes("Career"))
      return "border-blue-500/30 bg-blue-500/10";

    if (agent.includes("Finance"))
      return "border-green-500/30 bg-green-500/10";

    if (agent.includes("Health"))
      return "border-pink-500/30 bg-pink-500/10";

    if (agent.includes("Learning"))
      return "border-cyan-500/30 bg-cyan-500/10";

    return "border-slate-700 bg-slate-900";
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <p className="text-sm text-cyan-300">
          Multi-Agent Intelligence
        </p>

        <h1 className="mt-2 text-3xl sm:text-4xl font-bold">
          Agent Memory Dashboard
        </h1>

        <p className="mt-3 max-w-3xl text-slate-400">
          View insights generated and stored by Career,
          Finance, Health, and Learning agents.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Memories"
            value={memories.length}
          />

          <StatCard
            label="Career Memories"
            value={
              memories.filter((m) =>
                m.agent_name.includes("Career")
              ).length
            }
          />

          <StatCard
            label="Finance Memories"
            value={
              memories.filter((m) =>
                m.agent_name.includes("Finance")
              ).length
            }
          />

          <StatCard
            label="Health + Learning"
            value={
              memories.filter(
                (m) =>
                  m.agent_name.includes("Health") ||
                  m.agent_name.includes("Learning")
              ).length
            }
          />
        </div>

        {loading ? (
          <div className="mt-8 rounded-2xl bg-slate-900 p-5 sm:p-8">
            Loading agent memories...
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className={`rounded-2xl border p-5 sm:p-6 ${getAgentColor(
                  memory.agent_name
                )}`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      {memory.agent_name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-300">
                      {memory.insight_type}
                    </p>
                  </div>

                  <div className="w-fit rounded-full bg-slate-900 px-4 py-2 text-sm">
                    Confidence: {memory.confidence}%
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-slate-900 p-4">
                  <p className="text-sm font-semibold text-cyan-300">
                    Summary
                  </p>

                  <p className="mt-2 text-slate-300">
                    {memory.summary}
                  </p>
                </div>

                <div className="mt-4 rounded-xl bg-slate-900 p-4">
                  <p className="text-sm font-semibold text-emerald-300">
                    Recommendations
                  </p>

                  <ul className="mt-3 space-y-2">
                    {(memory.recommendation || []).map(
                      (item, index) => (
                        <li
                          key={index}
                          className="text-slate-300"
                        >
                          • {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="mt-4 rounded-xl bg-slate-900 p-4">
                  <p className="text-sm font-semibold text-yellow-300">
                    Risks
                  </p>

                  <ul className="mt-3 space-y-2">
                    {(memory.risks || []).map((item, index) => (
                      <li
                        key={index}
                        className="text-slate-300"
                      >
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-xl bg-slate-900 p-4">
                  <p className="text-sm font-semibold text-violet-300">
                    Source Question
                  </p>

                  <p className="mt-2 text-slate-300">
                    {memory.source_question}
                  </p>
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  Created:{" "}
                  {new Date(
                    memory.created_at
                  ).toLocaleString()}
                </p>
              </div>
            ))}

            {memories.length === 0 && (
              <div className="rounded-2xl bg-slate-900 p-5 sm:p-8 text-center text-slate-400">
                No agent memories found yet.

                <div className="mt-3">
                  Ask your Digital Twin Advisor a few
                  questions first.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <h2 className="mt-2 text-3xl font-bold text-cyan-400">
        {value}
      </h2>
    </div>
  );
}