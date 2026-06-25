"use client";

import { useEffect, useState } from "react";

type FinanceMemory = {
  monthly_income: number;
  target_monthly_savings: number;
  financial_goal: string;
  risk_level: string;
  budget_preference: string;
  notes: string;
};

export default function FinanceMemoryPage() {
  const [memory, setMemory] = useState<FinanceMemory>({
    monthly_income: 0,
    target_monthly_savings: 0,
    financial_goal: "",
    risk_level: "",
    budget_preference: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  const fetchMemory = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/finance/memory`
      );

      const data = await res.json();
      setMemory({
        monthly_income: Number(data.monthly_income || 0),
        target_monthly_savings: Number(data.target_monthly_savings || 0),
        financial_goal: data.financial_goal || "",
        risk_level: data.risk_level || "",
        budget_preference: data.budget_preference || "",
        notes: data.notes || "",
      });
    } catch (error) {
      console.error("Could not load finance memory:", error);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, []);

  const updateField = (field: keyof FinanceMemory, value: string) => {
    setMemory((prev) => ({
      ...prev,
      [field]:
        field === "monthly_income" || field === "target_monthly_savings"
          ? Number(value)
          : value,
    }));
  };

  const saveMemory = async () => {
    setSaving(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/finance/memory`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(memory),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to save finance memory");
      }

      alert("Finance Memory saved successfully.");
      fetchMemory();
    } catch (error) {
      console.error("Could not save finance memory:", error);
      alert("Could not save Finance Memory.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">Finance Memory</h1>

      <p className="mt-2 text-slate-400">
        Tell your Finance Twin about your income, savings goals, risk comfort,
        and financial priorities.
      </p>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm text-slate-400">Monthly Income</label>
            <input
              type="number"
              value={memory.monthly_income}
              onChange={(e) => updateField("monthly_income", e.target.value)}
              className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
              placeholder="5000"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400">
              Target Monthly Savings
            </label>
            <input
              type="number"
              value={memory.target_monthly_savings}
              onChange={(e) =>
                updateField("target_monthly_savings", e.target.value)
              }
              className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
              placeholder="1000"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400">Financial Goal</label>
            <input
              value={memory.financial_goal}
              onChange={(e) => updateField("financial_goal", e.target.value)}
              className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
              placeholder="Build emergency fund, buy a car, save for house..."
            />
          </div>

          <div>
            <label className="text-sm text-slate-400">Risk Level</label>
            <select
              value={memory.risk_level}
              onChange={(e) => updateField("risk_level", e.target.value)}
              className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
            >
              <option value="">Select Risk Level</option>
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-400">Budget Preference</label>
            <select
              value={memory.budget_preference}
              onChange={(e) =>
                updateField("budget_preference", e.target.value)
              }
              className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
            >
              <option value="">Select Budget Preference</option>
              <option value="Conservative Spending">
                Conservative Spending
              </option>
              <option value="Balanced Budget">Balanced Budget</option>
              <option value="Aggressive Savings">Aggressive Savings</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-400">Notes</label>
            <textarea
              value={memory.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={5}
              className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
              placeholder="Any personal financial preferences or constraints..."
            />
          </div>
        </div>

        <button
          onClick={saveMemory}
          disabled={saving}
          className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Finance Memory"}
        </button>
      </div>
    </main>
  );
}