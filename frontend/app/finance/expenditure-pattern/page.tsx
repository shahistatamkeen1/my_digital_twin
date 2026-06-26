"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CategoryBreakdown = {
  category: string;
  amount: number;
  percent: number;
};

type ExpenditurePattern = {
  income: number;
  expenses: number;
  savings: number;
  savings_rate: number;
  top_category: string;
  top_category_amount: number;
  category_breakdown: CategoryBreakdown[];
  spending_alert: string;
};

const COLORS = ["#6366f1", "#22c55e", "#f97316", "#06b6d4", "#e879f9", "#f43f5e"];

export default function ExpenditurePatternPage() {
  const [pattern, setPattern] = useState<ExpenditurePattern | null>(null);

  const fetchPattern = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/finance/expenditure-pattern`
      );

      const data = await res.json();
      setPattern(data);
    } catch (error) {
      console.error("Could not load expenditure pattern:", error);
    }
  };

  useEffect(() => {
    fetchPattern();
  }, []);

  if (!pattern) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading expenditure pattern...
      </main>
    );
  }

  const incomeExpenseData = [
    { name: "Income", amount: pattern.income },
    { name: "Expenses", amount: pattern.expenses },
    { name: "Savings", amount: pattern.savings },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">Expenditure Pattern</h1>

      <p className="mt-2 text-slate-400">
        Understand your income, expenses, savings rate, and spending behavior.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-slate-900 p-5 rounded-xl">
          <p className="text-slate-400 text-sm">Income</p>
          <h2 className="text-4xl font-bold mt-2">${pattern.income}</h2>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl">
          <p className="text-slate-400 text-sm">Expenses</p>
          <h2 className="text-4xl font-bold mt-2">${pattern.expenses}</h2>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl">
          <p className="text-slate-400 text-sm">Savings</p>
          <h2 className="text-4xl font-bold mt-2 text-green-400">
            ${pattern.savings}
          </h2>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl">
          <p className="text-slate-400 text-sm">Savings Rate</p>
          <h2 className="text-4xl font-bold mt-2 text-indigo-400">
            {pattern.savings_rate}%
          </h2>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold">Income vs Expenses vs Savings</h2>

          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    color: "#ffffff",
                  }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {incomeExpenseData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold">Expense Category Share</h2>

          {pattern.category_breakdown.length === 0 ? (
            <p className="mt-6 text-slate-400">
              No expense data yet. Add expense transactions first.
            </p>
          ) : (
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pattern.category_breakdown}
                    dataKey="amount"
                    nameKey="category"
                    outerRadius={120}
                    label={(props: any) =>
  `${props.category} ${Math.round((props.percent || 0) * 100)}%`
}
                  >
                    {pattern.category_breakdown.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      color: "#ffffff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <h2 className="text-xl font-semibold">Top Spending Category</h2>

        <p className="mt-4 text-slate-300">
          Your highest spending category is{" "}
          <span className="font-semibold text-white">{pattern.top_category}</span>{" "}
          with ${pattern.top_category_amount}.
        </p>
      </div>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <h2 className="text-xl font-semibold">Expense Breakdown</h2>

        {pattern.category_breakdown.length === 0 ? (
          <p className="mt-4 text-slate-400">
            No expense data yet. Add expense transactions first.
          </p>
        ) : (
          <div className="mt-6 space-y-5">
            {pattern.category_breakdown.map((item) => (
              <div key={item.category}>
                <div className="flex justify-between text-sm">
                  <span>{item.category}</span>
                  <span className="text-slate-400">
                    ${item.amount} · {item.percent}%
                  </span>
                </div>

                <div className="mt-2 h-3 bg-slate-800 rounded-full">
                  <div
                    className="h-3 bg-indigo-500 rounded-full"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <h2 className="text-xl font-semibold">Spending Alert</h2>

        <p className="mt-4 text-slate-300">{pattern.spending_alert}</p>
      </div>
    </main>
  );
}