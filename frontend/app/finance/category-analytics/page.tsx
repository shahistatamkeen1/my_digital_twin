"use client";

import { apiFetch } from "@/lib/api";

import { useCallback, useEffect, useMemo, useState } from "react";

type CategorySummary = {
  category: string;
  amount: number;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
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

export default function CategoryAnalyticsPage() {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCategorySummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(
        `${API_BASE}/api/finance/category-summary`,
        { cache: "no-store" }
      );
      const data = await readJson<CategorySummary[]>(response);

      setCategories(
        (Array.isArray(data) ? data : [])
          .map((item) => ({
            category: item.category?.trim() || "Uncategorized",
            amount: Number(item.amount ?? 0),
          }))
          .filter((item) => item.amount > 0)
          .sort((first, second) => second.amount - first.amount)
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load category analytics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategorySummary();
  }, [fetchCategorySummary]);

  const totalExpenses = useMemo(
    () => categories.reduce((sum, item) => sum + item.amount, 0),
    [categories]
  );
  const topCategory = categories[0];
  const averageCategory =
    categories.length > 0 ? totalExpenses / categories.length : 0;

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-400">
            Spending Analysis
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Category Analytics
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
            See where your expense money is going and identify the categories
            that deserve closer attention.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchCategorySummary()}
          disabled={loading}
          className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-emerald-500 hover:text-white disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh Analytics"}
        </button>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AnalyticsMetric
          label="Total Expenses"
          value={formatCurrency(totalExpenses)}
          loading={loading}
          tone="negative"
        />
        <AnalyticsMetric
          label="Top Category"
          value={topCategory?.category || "No data"}
          helper={topCategory ? formatCurrency(topCategory.amount) : undefined}
          loading={loading}
          tone="accent"
        />
        <AnalyticsMetric
          label="Average per Category"
          value={formatCurrency(averageCategory)}
          helper={`${categories.length} categories tracked`}
          loading={loading}
        />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="border-b border-slate-800 p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-white">
            Spending Breakdown
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Categories are ordered from highest to lowest spending.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="space-y-5">
              {[1, 2, 3, 4].map((item) => (
                <div key={item}>
                  <div className="h-5 w-1/3 animate-pulse rounded bg-slate-800" />
                  <div className="mt-3 h-3 animate-pulse rounded-full bg-slate-800" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
              <p className="font-medium text-white">
                No expense categories found
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Add expense transactions first. Finance Twin will group them
                automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((item, index) => {
                const percent =
                  totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;

                return (
                  <article key={`${item.category}-${index}`}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-xs font-bold text-slate-300">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-white">
                            {item.category}
                          </p>
                          <p className="text-xs text-slate-500">
                            {percent.toFixed(1)}% of total expenses
                          </p>
                        </div>
                      </div>

                      <span className="font-semibold text-slate-200">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AnalyticsMetric({
  label,
  value,
  helper,
  loading,
  tone = "default",
}: {
  label: string;
  value: string;
  helper?: string;
  loading: boolean;
  tone?: "default" | "negative" | "accent";
}) {
  const valueClass =
    tone === "negative"
      ? "text-rose-400"
      : tone === "accent"
        ? "text-emerald-400"
        : "text-white";

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      {loading ? (
        <div className="mt-3 h-9 w-32 animate-pulse rounded-lg bg-slate-800" />
      ) : (
        <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</p>
      )}
      {helper ? <p className="mt-2 text-xs text-slate-500">{helper}</p> : null}
    </article>
  );
}
