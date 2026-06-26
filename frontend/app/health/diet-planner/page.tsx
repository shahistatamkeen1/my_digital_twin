"use client";

import { useState } from "react";

type DietPlan = {
  diet_title: string;
  summary: string;
  daily_schedule: any[];
  meal_plan: any[];
  grocery_items: any[];
  local_searches: {
    label: string;
    query: string;
    maps_url: string;
  }[];
  budget_tip: string;
  health_note: string;
};

export default function DietPlannerPage() {
  const [location, setLocation] = useState("");
  const [budgetLevel, setBudgetLevel] = useState("Moderate");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    if (!location) {
      alert("Please enter your city or area.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/health/diet-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location,
            budget_level: budgetLevel,
            schedule_notes: scheduleNotes,
          }),
        }
      );

      const data = await res.json();
      setPlan(data);
    } catch (error) {
      console.error("Diet plan error:", error);
      alert("Could not generate diet plan.");
    } finally {
      setLoading(false);
    }
  };

  const renderList = (items?: any[]) => {
  if (!items || items.length === 0) {
    return <p className="text-slate-400">No items generated.</p>;
  }

  return (
    <ul className="list-disc list-inside space-y-2 text-slate-300">
      {items.map((item, index) => {
        if (typeof item === "string") {
          return <li key={index}>{item}</li>;
        }

        if (typeof item === "object" && item !== null) {
          return (
            <li key={index}>
              {Object.entries(item)
                .map(([key, value]) => `${key.replaceAll("_", " ")}: ${value}`)
                .join(" | ")}
            </li>
          );
        }

        return <li key={index}>{String(item)}</li>;
      })}
    </ul>
  );
};

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">Health Diet Planner</h1>

      <p className="mt-2 text-slate-400">
        Generate a diet plan using your Career Twin, Finance Twin, and Health Twin data.
      </p>

      <div className="mt-8 rounded-xl bg-slate-900 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or area, e.g. Chicago, IL"
            className="rounded-lg bg-slate-800 p-3 outline-none"
          />

          <select
            value={budgetLevel}
            onChange={(e) => setBudgetLevel(e.target.value)}
            className="rounded-lg bg-slate-800 p-3 outline-none"
          >
            <option>Low</option>
            <option>Moderate</option>
            <option>High</option>
          </select>

          <input
            value={scheduleNotes}
            onChange={(e) => setScheduleNotes(e.target.value)}
            placeholder="Work schedule notes"
            className="rounded-lg bg-slate-800 p-3 outline-none"
          />
        </div>

        <button
          onClick={generatePlan}
          disabled={loading}
          className="mt-5 rounded-lg bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Diet Plan"}
        </button>
      </div>

      {plan && (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-2xl font-bold">{plan.diet_title}</h2>
            <p className="mt-3 text-slate-300">{plan.summary}</p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Daily Schedule</h2>
            <div className="mt-4">{renderList(plan.daily_schedule)}</div>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Meal Plan</h2>
            <div className="mt-4">{renderList(plan.meal_plan)}</div>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Grocery Items</h2>
            <div className="mt-4">{renderList(plan.grocery_items)}</div>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Where to Buy Nearby</h2>

            {plan.local_searches?.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {plan.local_searches.map((item, index) => (
                  <a
                    key={index}
                    href={item.maps_url}
                    target="_blank"
                    className="rounded-lg border border-slate-700 bg-slate-800 p-4 hover:border-indigo-400"
                  >
                    <h3 className="font-semibold">{item.label}</h3>
                    <p className="mt-2 text-sm text-slate-400">{item.query}</p>
                    <p className="mt-3 text-sm text-indigo-400">
                      Open in Google Maps →
                    </p>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-slate-400">No local searches generated.</p>
            )}
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Budget Tip</h2>
            <p className="mt-3 text-slate-300">{plan.budget_tip}</p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Health Note</h2>
            <p className="mt-3 text-slate-300">{plan.health_note}</p>
          </div>
        </div>
      )}
    </main>
  );
}