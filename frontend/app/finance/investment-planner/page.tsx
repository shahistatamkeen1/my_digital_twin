"use client";

import { useState } from "react";

type InvestmentPlan = {
  plan_title: string;
  summary: string;
  emergency_fund_note: string;
  suggested_allocation: any[];
  investment_options: any[];
  stock_watchlist: any[];
  next_steps: any[];
  risk_note: string;
};

export default function InvestmentPlannerPage() {
  const [availableSavings, setAvailableSavings] = useState("5000");
  const [riskLevel, setRiskLevel] = useState("Moderate");
  const [goal, setGoal] = useState("");
  const [timeHorizon, setTimeHorizon] = useState("");
  const [plan, setPlan] = useState<InvestmentPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const renderList = (items?: any[]) => {
    if (!items || items.length === 0) {
      return <p className="text-slate-400">No items generated.</p>;
    }

    return (
      <ul className="list-disc list-inside space-y-2 text-slate-300">
        {items.map((item, index) => {
          if (typeof item === "string") {
            return <li key={index}>{item}</li>;
          }

          if (typeof item === "object" && item !== null) {
            return (
              <li key={index}>
                {Object.entries(item)
                  .map(([key, value]) => `${key.replaceAll("_", " ")}: ${value}`)
                  .join(" | ")}
              </li>
            );
          }

          return <li key={index}>{String(item)}</li>;
        })}
      </ul>
    );
  };

  const generatePlan = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/finance/investment-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            available_savings: Number(availableSavings || 0),
            risk_level: riskLevel,
            goal,
            time_horizon: timeHorizon,
          }),
        }
      );

      const data = await res.json();
      setPlan(data);
    } catch (error) {
      console.error("Investment planner error:", error);
      alert("Could not generate investment plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">Investment Planner</h1>

      <p className="mt-2 text-slate-400">
        Explore educational investment options based on your savings, goal, risk level, and time horizon.
      </p>

      <div className="mt-8 rounded-xl bg-slate-900 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            type="number"
            value={availableSavings}
            onChange={(e) => setAvailableSavings(e.target.value)}
            placeholder="Available savings"
            className="rounded-lg bg-slate-800 p-3 outline-none"
          />

          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className="rounded-lg bg-slate-800 p-3 outline-none"
          >
            <option>Low</option>
            <option>Moderate</option>
            <option>High</option>
          </select>

          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Goal, e.g. buy car, house, wealth"
            className="rounded-lg bg-slate-800 p-3 outline-none"
          />

          <input
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(e.target.value)}
            placeholder="Time horizon, e.g. 1 year"
            className="rounded-lg bg-slate-800 p-3 outline-none"
          />
        </div>

        <button
          onClick={generatePlan}
          disabled={loading}
          className="mt-5 rounded-lg bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Investment Plan"}
        </button>
      </div>

      {plan && (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-2xl font-bold">{plan.plan_title}</h2>
            <p className="mt-3 text-slate-300">{plan.summary}</p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Emergency Fund Note</h2>
            <p className="mt-3 text-slate-300">{plan.emergency_fund_note}</p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Suggested Allocation</h2>
            <div className="mt-4">{renderList(plan.suggested_allocation)}</div>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Investment Options</h2>
            <div className="mt-4">{renderList(plan.investment_options)}</div>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Stock / ETF Watchlist Ideas</h2>
            <p className="mt-2 text-sm text-slate-400">
              Educational watchlist only. Not guaranteed profit or buy advice.
            </p>
            <div className="mt-4">{renderList(plan.stock_watchlist)}</div>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Next Steps</h2>
            <div className="mt-4">{renderList(plan.next_steps)}</div>
          </div>

          <div className="rounded-xl border border-yellow-600/40 bg-yellow-900/10 p-6">
            <h2 className="text-xl font-semibold text-yellow-300">Risk Note</h2>
            <p className="mt-3 text-slate-300">{plan.risk_note}</p>
          </div>
        </div>
      )}
    </main>
  );
}