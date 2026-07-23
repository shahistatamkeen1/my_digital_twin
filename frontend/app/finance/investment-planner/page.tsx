"use client";

import { apiFetch } from "@/lib/api";

import { useState } from "react";

type PlanItem = string | Record<string, unknown>;

type InvestmentPlan = {
  plan_title: string;
  summary: string;
  emergency_fund_note: string;
  suggested_allocation: PlanItem[];
  investment_options: PlanItem[];
  stock_watchlist: PlanItem[];
  next_steps: PlanItem[];
  risk_note: string;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

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

function normalizePlan(data: Partial<InvestmentPlan>): InvestmentPlan {
  return {
    plan_title: data.plan_title?.trim() || "Personalized Investment Plan",
    summary: data.summary?.trim() || "",
    emergency_fund_note: data.emergency_fund_note?.trim() || "",
    suggested_allocation: Array.isArray(data.suggested_allocation)
      ? data.suggested_allocation
      : [],
    investment_options: Array.isArray(data.investment_options)
      ? data.investment_options
      : [],
    stock_watchlist: Array.isArray(data.stock_watchlist)
      ? data.stock_watchlist
      : [],
    next_steps: Array.isArray(data.next_steps) ? data.next_steps : [],
    risk_note: data.risk_note?.trim() || "",
  };
}

export default function InvestmentPlannerPage() {
  const [availableSavings, setAvailableSavings] = useState("5000");
  const [riskLevel, setRiskLevel] = useState("Moderate");
  const [goal, setGoal] = useState("");
  const [timeHorizon, setTimeHorizon] = useState("");
  const [plan, setPlan] = useState<InvestmentPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generatePlan = async () => {
    const savings = Number(availableSavings);

    if (!Number.isFinite(savings) || savings <= 0) {
      setError("Available savings must be greater than zero.");
      return;
    }

    if (!goal.trim() || !timeHorizon.trim()) {
      setError("Enter an investment goal and time horizon.");
      return;
    }

    setLoading(true);
    setError("");
    setPlan(null);

    try {
      const response = await apiFetch(
        `${API_BASE}/api/finance/investment-plan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            available_savings: savings,
            risk_level: riskLevel,
            goal: goal.trim(),
            time_horizon: timeHorizon.trim(),
          }),
        }
      );

      const data = await readJson<Partial<InvestmentPlan>>(response);
      setPlan(normalizePlan(data));
    } catch (planError) {
      setError(
        planError instanceof Error
          ? planError.message
          : "Could not generate the investment plan."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-400">
          Educational Planning
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Investment Planner
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Explore educational investment approaches based on your available
          savings, risk comfort, goal, and time horizon.
        </p>
      </section>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-6 text-amber-100">
        This tool provides educational planning ideas, not personalized
        financial, legal, or tax advice. Investment values can rise or fall.
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <Field label="Available Savings">
            <input
              type="number"
              min="0"
              step="0.01"
              value={availableSavings}
              onChange={(event) => setAvailableSavings(event.target.value)}
              placeholder="5000"
              className={inputClassName}
            />
          </Field>

          <Field label="Risk Level">
            <select
              value={riskLevel}
              onChange={(event) => setRiskLevel(event.target.value)}
              className={inputClassName}
            >
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>
          </Field>

          <Field label="Financial Goal">
            <input
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="Car, home, retirement, wealth..."
              className={inputClassName}
            />
          </Field>

          <Field label="Time Horizon">
            <input
              value={timeHorizon}
              onChange={(event) => setTimeHorizon(event.target.value)}
              placeholder="3 years"
              className={inputClassName}
            />
          </Field>
        </div>

        <button
          type="button"
          onClick={() => void generatePlan()}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Building Your Plan..." : "Generate Investment Plan"}
        </button>
      </section>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-2xl bg-slate-900"
            />
          ))}
        </div>
      ) : null}

      {plan ? (
        <section className="space-y-6">
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 p-5 sm:p-7">
            <p className="text-sm font-semibold text-emerald-300">
              Your Generated Plan
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              {plan.plan_title}
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200 sm:text-base">
              {plan.summary || "No summary was returned."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <PlanSection
              title="Emergency Fund First"
              description={plan.emergency_fund_note}
              emptyText="No emergency-fund note was generated."
            />
            <PlanListSection
              title="Suggested Allocation"
              items={plan.suggested_allocation}
            />
            <PlanListSection
              title="Investment Options"
              items={plan.investment_options}
            />
            <PlanListSection
              title="Stock and ETF Watchlist"
              description="Educational ideas to research further. These are not buy recommendations."
              items={plan.stock_watchlist}
            />
          </div>

          <PlanListSection title="Recommended Next Steps" items={plan.next_steps} />

          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-amber-300">Risk Note</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">
              {plan.risk_note || "No risk note was generated."}
            </p>
          </div>
        </section>
      ) : null}
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

function PlanSection({
  title,
  description,
  emptyText,
}: {
  title: string;
  description: string;
  emptyText: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
        {description || emptyText}
      </p>
    </article>
  );
}

function PlanListSection({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: PlanItem[];
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No items were generated.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <div className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-300">
                  {index + 1}
                </span>
                <PlanItemContent item={item} />
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function PlanItemContent({ item }: { item: PlanItem }) {
  if (typeof item === "string") {
    return <p className="text-sm leading-6 text-slate-300">{item}</p>;
  }

  return (
    <dl className="min-w-0 flex-1 space-y-2">
      {Object.entries(item).map(([key, value]) => (
        <div
          key={key}
          className="grid grid-cols-1 gap-1 sm:grid-cols-[150px_1fr]"
        >
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {key.replaceAll("_", " ")}
          </dt>
          <dd className="break-words text-sm leading-6 text-slate-300">
            {typeof value === "object"
              ? JSON.stringify(value)
              : String(value ?? "")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
