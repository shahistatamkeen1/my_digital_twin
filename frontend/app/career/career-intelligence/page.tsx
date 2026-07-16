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
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">Career Intelligence Agent</h1>

      <p className="mt-2 text-slate-400">
        Get a daily career action plan based on your memory, roadmap, and applications.
      </p>

      <button
        onClick={generatePlan}
        disabled={loading}
        className="mt-8 w-full rounded-lg bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Generating..." : "Generate Today's Career Plan"}
      </button>

      {result && (
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Today's Career Plan</h2>

            <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm">
              {result.priority_level} Priority
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="min-w-0 rounded-lg bg-slate-800 p-4 sm:p-5">
              <p className="text-slate-400 text-sm">Daily Focus</p>
              <p className="mt-2 whitespace-pre-wrap break-words font-medium leading-6">{result.daily_focus}</p>
            </div>

            <div className="min-w-0 rounded-lg bg-slate-800 p-4 sm:p-5">
              <p className="text-slate-400 text-sm">Skill to Learn</p>
              <p className="mt-2 whitespace-pre-wrap break-words font-medium leading-6">{result.skill_to_learn}</p>
            </div>

            <div className="min-w-0 rounded-lg bg-slate-800 p-4 sm:p-5">
              <p className="text-slate-400 text-sm">Project Task</p>
              <p className="mt-2 whitespace-pre-wrap break-words font-medium leading-6">{result.project_task}</p>
            </div>

            <div className="min-w-0 rounded-lg bg-slate-800 p-4 sm:p-5">
              <p className="text-slate-400 text-sm">Interview Topic</p>
              <p className="mt-2 whitespace-pre-wrap break-words font-medium leading-6">{result.interview_topic}</p>
            </div>

            <div className="min-w-0 rounded-lg bg-slate-800 p-4 sm:p-5">
              <p className="text-slate-400 text-sm">Application Goal</p>
              <p className="mt-2 whitespace-pre-wrap break-words font-medium leading-6">{result.application_goal}</p>
            </div>

            <div className="min-w-0 rounded-lg bg-slate-800 p-4 sm:p-5">
              <p className="text-slate-400 text-sm">Reason</p>
              <p className="mt-2 whitespace-pre-wrap break-words font-medium leading-6">{result.reason}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}