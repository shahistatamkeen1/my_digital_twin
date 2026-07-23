"use client";

import { apiFetch } from "@/lib/api";

import { useCallback, useEffect, useState } from "react";

type FinanceMemoryResponse = {
  monthly_income?: number;
  target_monthly_savings?: number;
  financial_goal?: string;
  risk_level?: string;
  budget_preference?: string;
  notes?: string;
};

type FinanceMemoryForm = {
  monthly_income: string;
  target_monthly_savings: string;
  financial_goal: string;
  risk_level: string;
  budget_preference: string;
  notes: string;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

const emptyMemory: FinanceMemoryForm = {
  monthly_income: "",
  target_monthly_savings: "",
  financial_goal: "",
  risk_level: "",
  budget_preference: "",
  notes: "",
};

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

export default function FinanceMemoryPage() {
  const [memory, setMemory] = useState<FinanceMemoryForm>(emptyMemory);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchMemory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(`${API_BASE}/api/finance/memory`, {
        cache: "no-store",
      });
      const data = await readJson<FinanceMemoryResponse>(response);

      setMemory({
        monthly_income:
          data.monthly_income === undefined || data.monthly_income === null
            ? ""
            : String(data.monthly_income),
        target_monthly_savings:
          data.target_monthly_savings === undefined ||
          data.target_monthly_savings === null
            ? ""
            : String(data.target_monthly_savings),
        financial_goal: data.financial_goal ?? "",
        risk_level: data.risk_level ?? "",
        budget_preference: data.budget_preference ?? "",
        notes: data.notes ?? "",
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load Finance Memory."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMemory();
  }, [fetchMemory]);

  const updateField = (field: keyof FinanceMemoryForm, value: string) => {
    setMemory((current) => ({ ...current, [field]: value }));
  };

  const saveMemory = async () => {
    const monthlyIncome = Number(memory.monthly_income || 0);
    const targetSavings = Number(memory.target_monthly_savings || 0);

    if (monthlyIncome < 0 || targetSavings < 0) {
      setError("Income and savings values cannot be negative.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(`${API_BASE}/api/finance/memory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_income: monthlyIncome,
          target_monthly_savings: targetSavings,
          financial_goal: memory.financial_goal.trim(),
          risk_level: memory.risk_level,
          budget_preference: memory.budget_preference,
          notes: memory.notes.trim(),
        }),
      });

      await readJson<unknown>(response);
      setMessage("Finance Memory saved successfully.");
      await fetchMemory();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save Finance Memory."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-400">
          Personalization
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Finance Memory
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Teach your Finance Twin about your income, savings target, risk
          comfort, and long-term financial priorities.
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

      <section className="max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl bg-slate-800"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Field label="Monthly Income">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={memory.monthly_income}
                  onChange={(event) =>
                    updateField("monthly_income", event.target.value)
                  }
                  className={inputClassName}
                  placeholder="5000"
                />
              </Field>

              <Field label="Target Monthly Savings">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={memory.target_monthly_savings}
                  onChange={(event) =>
                    updateField(
                      "target_monthly_savings",
                      event.target.value
                    )
                  }
                  className={inputClassName}
                  placeholder="1000"
                />
              </Field>

              <Field label="Financial Goal">
                <input
                  value={memory.financial_goal}
                  onChange={(event) =>
                    updateField("financial_goal", event.target.value)
                  }
                  className={inputClassName}
                  placeholder="Build an emergency fund, buy a car, save for a home..."
                />
              </Field>

              <Field label="Risk Level">
                <select
                  value={memory.risk_level}
                  onChange={(event) =>
                    updateField("risk_level", event.target.value)
                  }
                  className={inputClassName}
                >
                  <option value="">Select risk level</option>
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </Field>

              <Field label="Budget Preference">
                <select
                  value={memory.budget_preference}
                  onChange={(event) =>
                    updateField("budget_preference", event.target.value)
                  }
                  className={inputClassName}
                >
                  <option value="">Select budget preference</option>
                  <option value="Conservative Spending">
                    Conservative Spending
                  </option>
                  <option value="Balanced Budget">Balanced Budget</option>
                  <option value="Aggressive Savings">Aggressive Savings</option>
                </select>
              </Field>

              <div className="lg:col-span-2">
                <Field label="Personal Notes">
                  <textarea
                    value={memory.notes}
                    onChange={(event) =>
                      updateField("notes", event.target.value)
                    }
                    rows={5}
                    className={inputClassName}
                    placeholder="Add financial constraints, recurring responsibilities, or preferences your Finance Twin should remember."
                  />
                </Field>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row">
              <button
                type="button"
                onClick={() => void saveMemory()}
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Finance Memory"}
              </button>

              <button
                type="button"
                onClick={() => void fetchMemory()}
                disabled={loading || saving}
                className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-300 transition hover:border-emerald-500 hover:text-white disabled:opacity-60"
              >
                Reset Unsaved Changes
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      {label}
      {children}
    </label>
  );
}
