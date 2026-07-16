"use client";

import { useEffect, useState } from "react";

type FinanceSummary = {
  income: number;
  expenses: number;
  savings: number;
  budget_health: number;
  transactions?: number;
};

export default function FinanceDashboardPage() {
  const [summary, setSummary] = useState<FinanceSummary>({
    income: 0,
    expenses: 0,
    savings: 0,
    budget_health: 0,
    transactions: 0,
  });

  const [insight, setInsight] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  const loadSummary = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/finance/summary`
      );

      const data = await res.json();
      setSummary(data);
    } catch (error) {
      console.error("Could not load finance summary:", error);
    }
  };

  const generateInsight = async () => {
    setLoadingInsight(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/finance/insight`
      );

      const data = await res.json();
      setInsight(data.insight || "No insight generated.");
    } catch (error) {
      console.error("Could not generate finance insight:", error);
      alert("Could not generate finance insight.");
    } finally {
      setLoadingInsight(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <>
      <div className="flex flex-col gap-2">
  <h1 className="text-3xl font-bold sm:text-4xl">
    Finance Twin Dashboard
  </h1>

  <p className="text-sm leading-6 text-slate-400 sm:text-base">
    Your monthly financial overview and AI-powered money insights.
  </p>
</div>
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl bg-slate-900 p-5 sm:p-6">
          <p className="text-slate-400 text-sm">Monthly Income</p>
          <h2 className="text-2xl sm:text-4xl font-bold mt-2">${summary.income}</h2>
        </div>

        <div className="rounded-xl bg-slate-900 p-5 sm:p-6">
          <p className="text-slate-400 text-sm">Monthly Expenses</p>
          <h2 className="text-2xl sm:text-4xl font-bold mt-2">${summary.expenses}</h2>
        </div>

        <div className="rounded-xl bg-slate-900 p-5 sm:p-6">
          <p className="text-slate-400 text-sm">Savings</p>
          <h2 className="text-2xl sm:text-4xl font-bold mt-2 text-green-400">
            ${summary.savings}
          </h2>
        </div>

        <div className="rounded-xl bg-slate-900 p-5 sm:p-6">
          <p className="text-slate-400 text-sm">Budget Health</p>
          <h2 className="text-2xl sm:text-4xl font-bold mt-2 text-indigo-400">
            {summary.budget_health}%
          </h2>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">AI Finance Insight</h2>
            <p className="mt-1 text-slate-400">
              Personalized advice based on your current transactions.
            </p>
          </div>

          <button
            onClick={generateInsight}
            disabled={loadingInsight}
            className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50 sm:w-auto"
          >
            {loadingInsight ? "Analyzing..." : "Generate Insight"}
          </button>
        </div>

        {insight ? (
          <p className="mt-5 whitespace-pre-wrap text-slate-300">{insight}</p>
        ) : (
          <p className="mt-5 text-slate-400">
            Click Generate Insight to let Finance Twin analyze your income,
            expenses, savings, and spending pattern.
          </p>
        )}
      </div>
    </>
  );
}