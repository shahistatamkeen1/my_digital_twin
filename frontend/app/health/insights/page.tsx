"use client";

import { useState } from "react";

export default function HealthInsightsPage() {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/health/insight`
      );

      const data = await res.json();
      setInsight(data.insight || "No insight generated.");
    } catch (error) {
      console.error("Health insight error:", error);
      alert("Could not generate health insight.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">AI Health Insights</h1>

      <p className="mt-2 text-slate-400">
        Get personalized wellness suggestions based on your health memory and daily habits.
      </p>

      <button
        onClick={generateInsight}
        disabled={loading}
        className="mt-8 rounded-lg bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Generate Health Insight"}
      </button>

      {insight && (
        <div className="mt-8 rounded-xl bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Health Twin Recommendation</h2>

          <p className="mt-5 whitespace-pre-wrap text-slate-300">
            {insight}
          </p>
        </div>
      )}
    </main>
  );
}