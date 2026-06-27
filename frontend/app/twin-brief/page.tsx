"use client";

import { useState } from "react";

type TwinBrief = {
  greeting: string;
  overview: string;
  career_focus: string;
  finance_focus: string;
  health_focus: string;
  highest_roi_action: string;
  risk_alert: string;
  today_plan: any[];
  closing_note: string;
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

  const renderPlan = (items?: any[]) => {
    if (!items || items.length === 0) {
      return <p className="text-slate-400">No plan generated.</p>;
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
            <div className="mt-4">{renderPlan(brief.today_plan)}</div>
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