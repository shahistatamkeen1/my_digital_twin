"use client";

import { apiFetch } from "@/lib/api";

import { useCallback, useEffect, useMemo, useState } from "react";

type Transaction = {
  id: number;
  type: "Income" | "Expense";
  title: string;
  amount: number;
  category: string;
  date?: string;
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [type, setType] = useState<"Income" | "Expense">("Expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(`${API_BASE}/api/finance/`, {
        cache: "no-store",
      });
      const data = await readJson<Transaction[]>(response);
      setTransactions(
        (Array.isArray(data) ? data : []).map((item) => ({
          ...item,
          amount: Number(item.amount ?? 0),
        }))
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load transactions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async () => {
    const cleanTitle = title.trim();
    const cleanCategory = category.trim();
    const numericAmount = Number(amount);

    if (!cleanTitle || !cleanCategory || !amount) {
      setError("Enter a title, amount, and category.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(`${API_BASE}/api/finance/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: cleanTitle,
          amount: numericAmount,
          category: cleanCategory,
          date: new Date().toISOString(),
        }),
      });

      await readJson<unknown>(response);
      setTitle("");
      setAmount("");
      setCategory("");
      setMessage("Transaction added successfully.");
      await fetchTransactions();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the transaction."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteTransaction = async (id: number) => {
    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(`${API_BASE}/api/finance/${id}`, {
        method: "DELETE",
      });
      await readJson<unknown>(response);
      setTransactions((current) => current.filter((item) => item.id !== id));
      setMessage("Transaction deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the transaction."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const totals = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === "Income")
      .reduce((sum, item) => sum + item.amount, 0);
    const expenses = transactions
      .filter((item) => item.type === "Expense")
      .reduce((sum, item) => sum + item.amount, 0);

    return { income, expenses, net: income - expenses };
  }, [transactions]);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-400">
          Money Tracking
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Finance Transactions
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Record income and expenses so your Finance Twin can understand your
          cash flow and spending behavior.
        </p>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Income" value={totals.income} tone="positive" />
        <SummaryCard label="Total Expenses" value={totals.expenses} tone="negative" />
        <SummaryCard
          label="Net Cash Flow"
          value={totals.net}
          tone={totals.net >= 0 ? "positive" : "negative"}
        />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-white">Add Transaction</h2>
          <p className="mt-1 text-sm text-slate-400">
            Use a clear title and category to improve future analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.8fr_1.2fr_1fr_1fr_auto]">
          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as "Income" | "Expense")
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
          >
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Transaction title"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
          />

          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount"
            type="number"
            min="0"
            step="0.01"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
          />

          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Category"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
          />

          <button
            type="button"
            onClick={() => void addTransaction()}
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Adding..." : "Add"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Recent Transactions
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {transactions.length} transaction
              {transactions.length === 1 ? "" : "s"} recorded
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchTransactions()}
            disabled={loading}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-emerald-500 hover:text-white disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl bg-slate-800"
                />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
              <p className="font-medium text-white">No transactions yet</p>
              <p className="mt-2 text-sm text-slate-400">
                Add your first income or expense transaction above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-white">
                        {item.title}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.type === "Income"
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.category || "Uncategorized"}
                      {item.date
                        ? ` • ${new Date(item.date).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <p
                      className={`text-lg font-bold ${
                        item.type === "Income"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {item.type === "Income" ? "+" : "-"}
                      {formatCurrency(item.amount)}
                    </p>

                    <button
                      type="button"
                      onClick={() => void deleteTransaction(item.id)}
                      disabled={deletingId === item.id}
                      className="rounded-lg border border-red-500/30 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "positive" | "negative";
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p
        className={`mt-2 text-3xl font-bold ${
          tone === "positive" ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {formatCurrency(value)}
      </p>
    </article>
  );
}
