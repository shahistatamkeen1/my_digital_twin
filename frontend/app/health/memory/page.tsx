"use client";

import { apiFetch } from "@/lib/api";

import { useEffect, useState } from "react";

type HealthMemory = {
  health_goal: string;
  diet_preference: string;
  fitness_level: string;
  sleep_goal_hours: number;
  water_goal_cups: number;
  workout_goal_minutes: number;
  allergies: string;
  notes: string;
};

const initialMemory: HealthMemory = {
  health_goal: "",
  diet_preference: "",
  fitness_level: "",
  sleep_goal_hours: 8,
  water_goal_cups: 8,
  workout_goal_minutes: 30,
  allergies: "",
  notes: "",
};

export default function HealthMemoryPage() {
  const [memory, setMemory] = useState<HealthMemory>(initialMemory);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const fetchMemory = async () => {
    setError("");

    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/health/memory`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("Could not load Health Memory.");
      }

      const data = await res.json();

      setMemory({
        health_goal: data.health_goal || "",
        diet_preference: data.diet_preference || "",
        fitness_level: data.fitness_level || "",
        sleep_goal_hours: Number(data.sleep_goal_hours || 8),
        water_goal_cups: Number(data.water_goal_cups || 8),
        workout_goal_minutes: Number(data.workout_goal_minutes || 30),
        allergies: data.allergies || "",
        notes: data.notes || "",
      });
    } catch (loadError) {
      console.error("Could not load health memory:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load Health Memory."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMemory();
  }, []);

  const updateField = (field: keyof HealthMemory, value: string) => {
    setMemory((current) => ({
      ...current,
      [field]:
        field === "sleep_goal_hours" ||
        field === "water_goal_cups" ||
        field === "workout_goal_minutes"
          ? Number(value)
          : value,
    }));
  };

  const saveMemory = async () => {
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/health/memory`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(memory),
        }
      );

      if (!res.ok) {
        throw new Error("Could not save Health Memory.");
      }

      setSuccess("Health Memory saved successfully.");
      await fetchMemory();
    } catch (saveError) {
      console.error("Could not save health memory:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save Health Memory."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">
          Personal wellness context
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Health Memory
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Tell your Health Twin about your goals, diet preferences, fitness
          level, restrictions, and daily health targets.
        </p>
      </header>

      {error ? <Notice message={error} error /> : null}
      {success ? <Notice message={success} /> : null}

      {loading ? (
        <div className="h-[520px] animate-pulse rounded-2xl border border-slate-800 bg-slate-900" />
      ) : (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Health Goal">
              <input
                value={memory.health_goal}
                onChange={(event) =>
                  updateField("health_goal", event.target.value)
                }
                className={inputClassName}
                placeholder="Improve energy, build muscle, improve sleep..."
              />
            </Field>

            <Field label="Diet Preference">
              <select
                value={memory.diet_preference}
                onChange={(event) =>
                  updateField("diet_preference", event.target.value)
                }
                className={inputClassName}
              >
                <option value="">Select Diet Preference</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Non-Vegetarian">Non-Vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="High Protein">High Protein</option>
                <option value="Balanced Diet">Balanced Diet</option>
              </select>
            </Field>

            <Field label="Fitness Level">
              <select
                value={memory.fitness_level}
                onChange={(event) =>
                  updateField("fitness_level", event.target.value)
                }
                className={inputClassName}
              >
                <option value="">Select Fitness Level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </Field>

            <Field label="Sleep Goal Hours">
              <input
                type="number"
                min="0"
                step="0.5"
                value={memory.sleep_goal_hours}
                onChange={(event) =>
                  updateField("sleep_goal_hours", event.target.value)
                }
                className={inputClassName}
              />
            </Field>

            <Field label="Water Goal Cups">
              <input
                type="number"
                min="0"
                step="1"
                value={memory.water_goal_cups}
                onChange={(event) =>
                  updateField("water_goal_cups", event.target.value)
                }
                className={inputClassName}
              />
            </Field>

            <Field label="Workout Goal Minutes">
              <input
                type="number"
                min="0"
                step="5"
                value={memory.workout_goal_minutes}
                onChange={(event) =>
                  updateField("workout_goal_minutes", event.target.value)
                }
                className={inputClassName}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Allergies or Restrictions">
                <input
                  value={memory.allergies}
                  onChange={(event) =>
                    updateField("allergies", event.target.value)
                  }
                  className={inputClassName}
                  placeholder="Peanuts, dairy, gluten, none..."
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Additional Notes">
                <textarea
                  value={memory.notes}
                  onChange={(event) =>
                    updateField("notes", event.target.value)
                  }
                  rows={5}
                  className={inputClassName}
                  placeholder="Health preferences, routines, restrictions, or relevant context..."
                />
              </Field>
            </div>
          </div>

          <button
            type="button"
            onClick={saveMemory}
            disabled={saving}
            className="mt-6 w-full rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {saving ? "Saving..." : "Save Health Memory"}
          </button>
        </section>
      )}
    </div>
  );
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function Notice({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 text-sm ${
        error
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      }`}
    >
      {message}
    </div>
  );
}
