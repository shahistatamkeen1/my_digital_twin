"use client";

import { useState } from "react";

type LocalSearch = {
  label: string;
  query: string;
  maps_url: string;
};

type DietPlan = {
  diet_title: string;
  summary: string;
  daily_schedule: unknown[];
  meal_plan: unknown[];
  grocery_items: unknown[];
  local_searches: LocalSearch[];
  budget_tip: string;
  health_note: string;
};

export default function DietPlannerPage() {
  const [location, setLocation] = useState("");
  const [budgetLevel, setBudgetLevel] = useState("Moderate");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generatePlan = async () => {
    if (!location.trim()) {
      setError("Please enter your city or area.");
      return;
    }

    setLoading(true);
    setError("");
    setPlan(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/health/diet-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location: location.trim(),
            budget_level: budgetLevel,
            schedule_notes: scheduleNotes.trim(),
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Health Twin could not generate the diet plan.");
      }

      const data = await res.json();

      setPlan({
        diet_title: data.diet_title || "Personalized Diet Plan",
        summary: data.summary || "",
        daily_schedule: Array.isArray(data.daily_schedule)
          ? data.daily_schedule
          : [],
        meal_plan: Array.isArray(data.meal_plan) ? data.meal_plan : [],
        grocery_items: Array.isArray(data.grocery_items)
          ? data.grocery_items
          : [],
        local_searches: Array.isArray(data.local_searches)
          ? data.local_searches
          : [],
        budget_tip: data.budget_tip || "",
        health_note: data.health_note || "",
      });
    } catch (requestError) {
      console.error("Diet plan error:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not generate the diet plan."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">
          Personalized nutrition
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Health Diet Planner
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Generate a practical diet plan using Health Memory, working schedule,
          financial context, budget level, and location.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-white">Plan Preferences</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Add your area so Health Twin can also suggest affordable nearby
          grocery options.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-300">
              City or Area
            </span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Chicago, IL"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">
              Budget Level
            </span>
            <select
              value={budgetLevel}
              onChange={(event) => setBudgetLevel(event.target.value)}
              className={inputClassName}
            >
              <option>Low</option>
              <option>Moderate</option>
              <option>High</option>
            </select>
          </label>

          <label className="block md:col-span-2 xl:col-span-1">
            <span className="text-sm font-medium text-slate-300">
              Work or Study Schedule
            </span>
            <input
              value={scheduleNotes}
              onChange={(event) => setScheduleNotes(event.target.value)}
              placeholder="9 AM–5 PM, evening classes..."
              className={inputClassName}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={generatePlan}
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? "Generating..." : "Generate Diet Plan"}
        </button>
      </section>

      {loading ? <DietPlanSkeleton /> : null}

      {plan ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-500/[0.08] to-pink-500/[0.03] p-5 sm:p-6">
            <p className="text-xs font-medium text-rose-300">
              Personalized plan
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {plan.diet_title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {plan.summary}
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <PlanSection
              title="Daily Schedule"
              description="Suggested meal timing around your routine."
              items={plan.daily_schedule}
              icon="🕒"
            />

            <PlanSection
              title="Meal Plan"
              description="Meals selected for your preferences and goals."
              items={plan.meal_plan}
              icon="🍽️"
            />

            <PlanSection
              title="Grocery Items"
              description="A practical shopping list for the plan."
              items={plan.grocery_items}
              icon="🛒"
            />

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10">
                  📍
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Affordable Places Nearby
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Open a generated search directly in Google Maps.
                  </p>
                </div>
              </div>

              {plan.local_searches.length > 0 ? (
                <div className="mt-5 grid grid-cols-1 gap-3">
                  {plan.local_searches.map((item, index) => (
                    <a
                      key={`${item.label}-${index}`}
                      href={item.maps_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 transition hover:border-rose-500/50 hover:bg-slate-800"
                    >
                      <h3 className="font-semibold text-white">
                        {item.label || "Nearby option"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {item.query}
                      </p>
                      <p className="mt-3 text-sm font-medium text-rose-300">
                        Open in Google Maps →
                      </p>
                    </a>
                  ))}
                </div>
              ) : (
                <EmptyMessage text="No nearby searches were generated." />
              )}
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <NoteCard
              title="Budget Tip"
              text={plan.budget_tip}
              icon="💵"
              tone="emerald"
            />
            <NoteCard
              title="Health Note"
              text={plan.health_note}
              icon="❤️"
              tone="rose"
            />
          </div>

          <p className="text-xs leading-5 text-slate-500">
            This plan is general wellness guidance and does not replace advice
            from a qualified healthcare professional or registered dietitian.
          </p>
        </div>
      ) : null}
    </div>
  );
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20";

function PlanSection({
  title,
  description,
  items,
  icon,
}: {
  title: string;
  description: string;
  items: unknown[];
  icon: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            {description}
          </p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="mt-5 space-y-3">
          {items.map((item, index) => (
            <StructuredItem key={index} item={item} index={index} />
          ))}
        </div>
      ) : (
        <EmptyMessage text="No items were generated." />
      )}
    </section>
  );
}

function StructuredItem({
  item,
  index,
}: {
  item: unknown;
  index: number;
}) {
  if (typeof item === "string") {
    return (
      <article className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-xs font-bold text-rose-300">
            {index + 1}
          </span>
          <p className="text-sm leading-6 text-slate-300">{item}</p>
        </div>
      </article>
    );
  }

  if (item && typeof item === "object") {
    return (
      <article className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
        <div className="space-y-3">
          {Object.entries(item as Record<string, unknown>).map(
            ([key, value]) => (
              <div
                key={key}
                className="grid grid-cols-1 gap-1 sm:grid-cols-[140px_1fr]"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-300">
                  {formatLabel(key)}
                </p>
                <p className="text-sm leading-6 text-slate-300">
                  {formatValue(value)}
                </p>
              </div>
            )
          )}
        </div>
      </article>
    );
  }

  return null;
}

function NoteCard({
  title,
  text,
  icon,
  tone,
}: {
  title: string;
  text: string;
  icon: string;
  tone: "emerald" | "rose";
}) {
  const styles =
    tone === "emerald"
      ? "border-emerald-500/25 bg-emerald-500/[0.06]"
      : "border-rose-500/25 bg-rose-500/[0.06]";

  return (
    <section className={`rounded-2xl border p-5 sm:p-6 ${styles}`}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-300">
        {text || "No note was generated."}
      </p>
    </section>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <p className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/30 p-5 text-sm text-slate-400">
      {text}
    </p>
  );
}

function DietPlanSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-36 animate-pulse rounded-2xl border border-slate-800 bg-slate-900" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-900"
          />
        ))}
      </div>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).join(", ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value ?? "");
}
