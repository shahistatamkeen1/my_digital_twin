"use client";

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

export default function HealthMemoryPage() {
  const [memory, setMemory] = useState<HealthMemory>({
    health_goal: "",
    diet_preference: "",
    fitness_level: "",
    sleep_goal_hours: 8,
    water_goal_cups: 8,
    workout_goal_minutes: 30,
    allergies: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchMemory = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/health/memory`
      );

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
    } catch (error) {
      console.error("Could not load health memory:", error);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, []);

  const updateField = (field: keyof HealthMemory, value: string) => {
    setMemory((prev) => ({
      ...prev,
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
    setSuccess(false);

    try {
      const res = await fetch(
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
        throw new Error("Failed to save health memory");
      }

      setSuccess(true);
      fetchMemory();

      setTimeout(() => {
        setSuccess(false);
      }, 2500);
    } catch (error) {
      console.error("Could not save health memory:", error);
      alert("Could not save Health Memory.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">Health Memory</h1>

      <p className="mt-2 text-slate-400">
        Tell your Health Twin about your wellness goals, diet preferences,
        fitness level, and daily health targets.
      </p>

      {success && (
        <div className="mt-5 rounded-lg border border-green-600 bg-green-900/20 p-3 text-green-400">
          ✓ Health Memory saved successfully.
        </div>
      )}

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm text-slate-400">Health Goal</label>
            <input
              value={memory.health_goal}
              onChange={(e) => updateField("health_goal", e.target.value)}
              className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
              placeholder="Lose weight, improve energy, build muscle..."
            />
          </div>

          <div>
            <label className="text-sm text-slate-400">Diet Preference</label>
            <select
              value={memory.diet_preference}
              onChange={(e) => updateField("diet_preference", e.target.value)}
              className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
            >
              <option value="">Select Diet Preference</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="High Protein">High Protein</option>
              <option value="Balanced Diet">Balanced Diet</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-400">Fitness Level</label>
            <select
              value={memory.fitness_level}
              onChange={(e) => updateField("fitness_level", e.target.value)}
              className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
            >
              <option value="">Select Fitness Level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-400">Sleep Goal Hours</label>
            <input
              type="number"
              value={memory.sleep_goal_hours}
              onChange={(e) => updateField("sleep_goal_hours", e.target.value)}
              className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400">Water Goal Cups</label>
            <input
              type="number"
              value={memory.water_goal_cups}
              onChange={(e) => updateField("water_goal_cups", e.target.value)}
              className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400">
              Workout Goal Minutes
            </label>
            <input
              type="number"
              value={memory.workout_goal_minutes}
              onChange={(e) =>
                updateField("workout_goal_minutes", e.target.value)
              }
              className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-400">Allergies</label>
            <input
              value={memory.allergies}
              onChange={(e) => updateField("allergies", e.target.value)}
              className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
              placeholder="Peanuts, dairy, gluten, none..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-400">Notes</label>
            <textarea
              value={memory.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={5}
              className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
              placeholder="Any health preferences, restrictions, or personal routines..."
            />
          </div>
        </div>

        <button
          onClick={saveMemory}
          disabled={saving}
          className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Health Memory"}
        </button>
      </div>
    </main>
  );
}