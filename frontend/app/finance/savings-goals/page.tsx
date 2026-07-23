"use client";

import { apiFetch } from "@/lib/api";

import { useCallback, useEffect, useMemo, useState } from "react";

type SavingsGoal = {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
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

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(`${API_BASE}/api/finance/savings-goals`, {
        cache: "no-store",
      });
      const data = await readJson<SavingsGoal[]>(response);

      setGoals(
        (Array.isArray(data) ? data : []).map((goal) => ({
          ...goal,
          target_amount: Number(goal.target_amount ?? 0),
          current_amount: Number(goal.current_amount ?? 0),
          deadline: goal.deadline ?? "",
        }))
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load savings goals."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGoals();
  }, [fetchGoals]);

  const addGoal = async () => {
    const cleanTitle = title.trim();
    const target = Number(targetAmount);
    const current = Number(currentAmount || 0);

    if (!cleanTitle || !targetAmount) {
      setError("Enter a goal title and target amount.");
      return;
    }

    if (!Number.isFinite(target) || target <= 0) {
      setError("Target amount must be greater than zero.");
      return;
    }

    if (!Number.isFinite(current) || current < 0) {
      setError("Current amount cannot be negative.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(`${API_BASE}/api/finance/savings-goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          target_amount: target,
          current_amount: current,
          deadline,
        }),
      });

      await readJson<unknown>(response);
      setTitle("");
      setTargetAmount("");
      setCurrentAmount("");
      setDeadline("");
      setMessage("Savings goal added successfully.");
      await fetchGoals();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the goal."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteGoal = async (id: number) => {
    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(
        `${API_BASE}/api/finance/savings-goals/${id}`,
        { method: "DELETE" }
      );
      await readJson<unknown>(response);
      setGoals((current) => current.filter((goal) => goal.id !== id));
      setMessage("Savings goal deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the goal."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const totals = useMemo(() => {
    const target = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const saved = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
    const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;

    return { target, saved, progress };
  }, [goals]);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-400">
          Financial Planning
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Savings Goals
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Create financial targets and track how close you are to reaching
          each one.
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
        <GoalMetric label="Total Goal Value" value={formatCurrency(totals.target)} />
        <GoalMetric label="Total Saved" value={formatCurrency(totals.saved)} />
        <GoalMetric
          label="Overall Progress"
          value={`${Math.round(totals.progress)}%`}
          progress={totals.progress}
        />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-white">Create a New Goal</h2>
          <p className="mt-1 text-sm text-slate-400">
            A deadline is optional, but it helps Finance Twin understand your
            timeline.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Goal title"
            className={inputClassName}
          />
          <input
            value={targetAmount}
            onChange={(event) => setTargetAmount(event.target.value)}
            placeholder="Target amount"
            type="number"
            min="0"
            step="0.01"
            className={inputClassName}
          />
          <input
            value={currentAmount}
            onChange={(event) => setCurrentAmount(event.target.value)}
            placeholder="Current amount"
            type="number"
            min="0"
            step="0.01"
            className={inputClassName}
          />
          <input
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            type="date"
            className={inputClassName}
          />
          <button
            type="button"
            onClick={() => void addGoal()}
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Adding..." : "Add Goal"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Your Goals</h2>
            <p className="mt-1 text-sm text-slate-400">
              {goals.length} active goal{goals.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchGoals()}
            disabled={loading}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-emerald-500 hover:text-white disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-48 animate-pulse rounded-xl bg-slate-800"
                />
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
              <p className="font-medium text-white">No savings goals yet</p>
              <p className="mt-2 text-sm text-slate-400">
                Add your first goal using the form above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {goals.map((goal) => {
                const progress =
                  goal.target_amount > 0
                    ? Math.max(
                        0,
                        Math.min(
                          (goal.current_amount / goal.target_amount) * 100,
                          100
                        )
                      )
                    : 0;
                const remaining = Math.max(
                  goal.target_amount - goal.current_amount,
                  0
                );

                return (
                  <article
                    key={goal.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-white">
                          {goal.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {formatCurrency(goal.current_amount)} saved of{" "}
                          {formatCurrency(goal.target_amount)}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        {Math.round(progress)}%
                      </span>
                    </div>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-slate-900 p-3">
                        <p className="text-xs text-slate-500">Remaining</p>
                        <p className="mt-1 font-semibold text-slate-200">
                          {formatCurrency(remaining)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-900 p-3">
                        <p className="text-xs text-slate-500">Deadline</p>
                        <p className="mt-1 font-semibold text-slate-200">
                          {goal.deadline
                            ? new Date(`${goal.deadline}T00:00:00`).toLocaleDateString()
                            : "Not set"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void deleteGoal(goal.id)}
                      disabled={deletingId === goal.id}
                      className="mt-5 w-full rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
                    >
                      {deletingId === goal.id ? "Deleting..." : "Delete Goal"}
                    </button>
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

const inputClassName =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500";

function GoalMetric({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress?: number;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {typeof progress === "number" ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </article>
  );
}
