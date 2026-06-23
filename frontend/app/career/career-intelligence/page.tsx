"use client";

import { useState } from "react";

type IntelligenceResult = {
  daily_focus: string;
  skill_to_learn: string;
  project_task: string;
  interview_topic: string;
  application_goal: string;
  reason: string;
  priority_level: string;
};

export default function CareerIntelligencePage() {
  const [result, setResult] = useState<IntelligenceResult | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/career-intelligence/`
      );

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Could not generate career intelligence.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold">Career Intelligence Agent</h1>

      <p className="mt-2 text-slate-400">
        Get a daily career action plan based on your memory, roadmap, and applications.
      </p>

      <button
        onClick={generatePlan}
        disabled={loading}
        className="mt-8 bg-indigo-600 px-5 py-3 rounded-lg hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Today's Career Plan"}
      </button>

      {result && (
        <div className="mt-8 bg-slate-900 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Today's Career Plan</h2>

            <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm">
              {result.priority_level} Priority
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-slate-400 text-sm">Daily Focus</p>
              <p className="mt-2 font-medium">{result.daily_focus}</p>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-slate-400 text-sm">Skill to Learn</p>
              <p className="mt-2 font-medium">{result.skill_to_learn}</p>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-slate-400 text-sm">Project Task</p>
              <p className="mt-2 font-medium">{result.project_task}</p>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-slate-400 text-sm">Interview Topic</p>
              <p className="mt-2 font-medium">{result.interview_topic}</p>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-slate-400 text-sm">Application Goal</p>
              <p className="mt-2 font-medium">{result.application_goal}</p>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-slate-400 text-sm">Reason</p>
              <p className="mt-2 font-medium">{result.reason}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}