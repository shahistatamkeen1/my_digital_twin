"use client";

import { useEffect, useState } from "react";

type CategorySummary = {
  category: string;
  amount: number;
};

export default function CategoryAnalyticsPage() {
  const [categories, setCategories] = useState<CategorySummary[]>([]);

  const fetchCategorySummary = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/finance/category-summary`
      );

      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Could not load category summary:", error);
    }
  };

  useEffect(() => {
    fetchCategorySummary();
  }, []);

  const totalExpenses = categories.reduce((sum, item) => sum + item.amount, 0);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">Category Analytics</h1>

      <p className="mt-2 text-slate-400">
        Understand where your money is going by expense category.
      </p>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <h2 className="text-xl font-semibold">Spending Breakdown</h2>

        {categories.length === 0 ? (
          <p className="mt-4 text-slate-400">
            No expense categories found. Add expense transactions first.
          </p>
        ) : (
          <div className="mt-6 space-y-5">
            {categories.map((item) => {
              const percent =
                totalExpenses > 0
                  ? Math.round((item.amount / totalExpenses) * 100)
                  : 0;

              return (
                <div key={item.category}>
                  <div className="flex justify-between text-sm">
                    <span>{item.category}</span>
                    <span className="text-slate-400">
                      ${item.amount} · {percent}%
                    </span>
                  </div>

                  <div className="mt-2 h-3 bg-slate-800 rounded-full">
                    <div
                      className="h-3 bg-indigo-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}