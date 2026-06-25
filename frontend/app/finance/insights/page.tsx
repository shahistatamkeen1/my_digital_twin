"use client";

import { useState } from "react";

export default function FinanceInsightsPage() {
  const [insight, setInsight] = useState("");

  const generateInsight = () => {
    setInsight(
      "Finance Twin will soon analyze your income, spending, savings goals, and recurring expenses to provide personalized financial recommendations."
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">AI Finance Insights</h1>

      <p className="mt-2 text-slate-400">
        Get personalized financial suggestions based on your spending behavior.
      </p>

      <button
        onClick={generateInsight}
        className="mt-8 bg-indigo-600 px-5 py-3 rounded-lg hover:bg-indigo-500"
      >
        Generate Finance Insight
      </button>

      {insight && (
        <div className="mt-8 bg-slate-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold">Finance Twin Recommendation</h2>
          <p className="mt-4 text-slate-300">{insight}</p>
        </div>
      )}
    </main>
  );
}