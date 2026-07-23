"use client";

import { apiFetch } from "@/lib/api";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

const CHART_COLORS = [
  "#10b981",
  "#06b6d4",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#f43f5e",
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function normalizePercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  const normalized = value > 0 && value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(normalized, 100));
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "detail" in payload
        ? String(payload.detail)
        : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload as T;
}

export default function ExpenditurePatternPage() {
  const [pattern, setPattern] = useState<ExpenditurePattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPattern = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(
        `${API_BASE}/api/finance/expenditure-pattern`,
        { cache: "no-store" }
      );
      const data = await readJson<Partial<ExpenditurePattern>>(response);

      setPattern({
        income: Number(data.income ?? 0),
        expenses: Number(data.expenses ?? 0),
        savings: Number(data.savings ?? 0),
        savings_rate: Number(data.savings_rate ?? 0),
        top_category: data.top_category?.trim() || "No category yet",
        top_category_amount: Number(data.top_category_amount ?? 0),
        category_breakdown: (
          Array.isArray(data.category_breakdown)
            ? data.category_breakdown
            : []
        ).map((item) => ({
          category: item.category?.trim() || "Uncategorized",
          amount: Number(item.amount ?? 0),
          percent: normalizePercent(Number(item.percent ?? 0)),
        })),
        spending_alert:
          data.spending_alert?.trim() ||
          "Add more transactions to receive a spending alert.",
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load the expenditure pattern."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPattern();
  }, [fetchPattern]);

  const barData = useMemo(
    () =>
      pattern
        ? [
            { name: "Income", amount: pattern.income },
            { name: "Expenses", amount: pattern.expenses },
            { name: "Savings", amount: pattern.savings },
          ]
        : [],
    [pattern]
  );

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-400">
            Spending Behavior
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Expenditure Pattern
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
            Understand the relationship between your income, expenses, savings
            rate, and expense categories.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchPattern()}
          disabled={loading}
          className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-emerald-500 hover:text-white disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh Pattern"}
        </button>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading || !pattern ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl bg-slate-900"
            />
          ))}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PatternMetric label="Income" value={formatCurrency(pattern.income)} />
            <PatternMetric
              label="Expenses"
              value={formatCurrency(pattern.expenses)}
              tone="negative"
            />
            <PatternMetric
              label="Savings"
              value={formatCurrency(pattern.savings)}
              tone={pattern.savings >= 0 ? "positive" : "negative"}
            />
            <PatternMetric
              label="Savings Rate"
              value={`${normalizePercent(pattern.savings_rate).toFixed(1)}%`}
              tone="accent"
            />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartPanel
              title="Income, Expenses, and Savings"
              description="A direct comparison of the main cash-flow values."
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(Number(value ?? 0))
                      }
                      contentStyle={{
                        backgroundColor: "#020617",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                      {barData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>

            <ChartPanel
              title="Expense Category Share"
              description="How your total expense amount is divided across categories."
            >
              {pattern.category_breakdown.length === 0 ? (
                <EmptyChartMessage />
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pattern.category_breakdown}
                        dataKey="amount"
                        nameKey="category"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={3}
                      >
                        {pattern.category_breakdown.map((_, index) => (
                          <Cell
                            key={index}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(Number(value ?? 0))
                        }
                        contentStyle={{
                          backgroundColor: "#020617",
                          border: "1px solid #334155",
                          borderRadius: "12px",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartPanel>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
              <p className="text-sm font-semibold text-emerald-400">
                Top Spending Category
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                {pattern.top_category}
              </h2>
              <p className="mt-3 text-3xl font-bold text-rose-400">
                {formatCurrency(pattern.top_category_amount)}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                This is currently the largest contributor to your recorded
                expenses.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 sm:p-6">
              <p className="text-sm font-semibold text-amber-300">
                Spending Alert
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200 sm:text-base">
                {pattern.spending_alert}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="border-b border-slate-800 p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-white">
                Expense Breakdown
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Review each category and its share of your total expenses.
              </p>
            </div>

            <div className="p-5 sm:p-6">
              {pattern.category_breakdown.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center text-sm text-slate-400">
                  Add expense transactions to populate this breakdown.
                </div>
              ) : (
                <div className="space-y-6">
                  {pattern.category_breakdown.map((item, index) => (
                    <article key={`${item.category}-${index}`}>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-medium text-white">
                          {item.category}
                        </span>
                        <span className="text-sm text-slate-400">
                          {formatCurrency(item.amount)} •{" "}
                          {normalizePercent(item.percent).toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                          style={{
                            width: `${normalizePercent(item.percent)}%`,
                          }}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function PatternMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative" | "accent";
}) {
  const valueClass =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
        ? "text-rose-400"
        : tone === "accent"
          ? "text-cyan-400"
          : "text-white";

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</p>
    </article>
  );
}

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
      <div className="mt-6">{children}</div>
    </article>
  );
}

function EmptyChartMessage() {
  return (
    <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center text-sm text-slate-400">
      Add expense transactions to generate this chart.
    </div>
  );
}
