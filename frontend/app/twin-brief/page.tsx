"use client";

import { useState } from "react";

type FocusScores = {
  career_score: number;
  finance_score: number;
  health_score: number;
  overall_score: number;
  highest_roi_focus: string;
};

type TwinBrief = {
  greeting: string;
  overview: string;
  career_focus: string;
  finance_focus: string;
  health_focus: string;
  highest_roi_action: string;
  today_best_action: string;
  risk_alert: string;
  today_plan: any[];
  weekly_wins: any[];
  closing_note: string;
  focus_scores: FocusScores;
};

export default function TwinBriefPage() {
  const [brief, setBrief] = useState<TwinBrief | null>(null);
  const [loading, setLoading] = useState(false);

  const generateBrief = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/twin-brief/`
      );

      const data = await res.json();
      setBrief(data);
    } catch (error) {
      console.error("Daily Brief error:", error);
      alert("Could not generate Daily Brief.");
    } finally {
      setLoading(false);
    }
  };

  const renderList = (items?: any[]) => {
    if (!items || items.length === 0) {
      return <p className="text-slate-400">No items generated.</p>;
    }

    return (
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="rounded-lg bg-slate-800 p-4">
            {typeof item === "string"
              ? item
              : Object.entries(item)
                  .map(([key, value]) => `${key.replaceAll("_", " ")}: ${value}`)
                  .join(" | ")}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <p className="text-sm text-cyan-300">Master Digital Twin</p>

      <h1 className="mt-2 text-4xl font-bold">Daily Brief</h1>

      <p className="mt-3 max-w-3xl text-slate-400">
        Generate a personalized daily plan using your personal memory, career,
        finance, and health data.
      </p>

      <button
        onClick={generateBrief}
        disabled={loading}
        className="mt-8 rounded-lg bg-cyan-600 px-5 py-3 font-medium hover:bg-cyan-500 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Daily Brief"}
      </button>

      {brief && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
            <h2 className="text-2xl font-bold">{brief.greeting}</h2>
            <p className="mt-3 text-slate-300">{brief.overview}</p>
          </div>

          {brief.focus_scores && (
            <div className="rounded-xl bg-slate-900 p-6">
              <h2 className="text-xl font-bold">Twin Focus Scores</h2>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                <ScoreCard label="Career" value={brief.focus_scores.career_score} />
                <ScoreCard label="Finance" value={brief.focus_scores.finance_score} />
                <ScoreCard label="Health" value={brief.focus_scores.health_score} />
                <ScoreCard label="Overall" value={brief.focus_scores.overall_score} />
              </div>

              <div className="mt-5 rounded-lg border border-indigo-500 bg-indigo-500/10 p-4">
                <p className="text-sm text-slate-300">Highest ROI Focus</p>
                <h3 className="mt-1 font-semibold text-white">
                  {brief.focus_scores.highest_roi_focus}
                </h3>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
            <h2 className="text-xl font-semibold text-emerald-300">
              Today&apos;s Best Action
            </h2>
            <p className="mt-3 text-slate-200">{brief.today_best_action}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <BriefCard title="Career Focus" content={brief.career_focus} />
            <BriefCard title="Finance Focus" content={brief.finance_focus} />
            <BriefCard title="Health Focus" content={brief.health_focus} />
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Highest ROI Action</h2>
            <p className="mt-3 text-slate-300">{brief.highest_roi_action}</p>
          </div>

          <div className="rounded-xl border border-yellow-600/40 bg-yellow-900/10 p-6">
            <h2 className="text-xl font-semibold text-yellow-300">Risk Alert</h2>
            <p className="mt-3 text-slate-300">{brief.risk_alert}</p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Today&apos;s Plan</h2>
            <div className="mt-4">{renderList(brief.today_plan)}</div>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Weekly Wins</h2>
            <div className="mt-4">{renderList(brief.weekly_wins)}</div>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Closing Note</h2>
            <p className="mt-3 text-slate-300">{brief.closing_note}</p>
          </div>
        </div>
      )}
    </main>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-800 p-4">
      <p className="text-sm text-slate-400">{label}</p>

      <h3 className="mt-2 text-3xl font-bold text-cyan-400">{value}%</h3>

      <div className="mt-3 h-3 rounded-full bg-slate-700">
        <div
          className="h-3 rounded-full bg-cyan-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function BriefCard({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-xl bg-slate-900 p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">{content}</p>
    </div>
  );
}