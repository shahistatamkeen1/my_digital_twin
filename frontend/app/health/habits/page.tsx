"use client";

import { useEffect, useMemo, useState } from "react";

type HealthHabit = {
  id: number;
  date: string;
  water_cups: number;
  sleep_hours: number;
  workout_minutes: number;
  mood: string;
  notes: string;
};

export default function HealthHabitsPage() {
  const [habits, setHabits] = useState<HealthHabit[]>([]);
  const [date, setDate] = useState("");
  const [waterCups, setWaterCups] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [workoutMinutes, setWorkoutMinutes] = useState("");
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchHabits = async () => {
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/health/habits`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("Could not load health habits.");
      }

      const data = await res.json();

      setHabits(
        (Array.isArray(data) ? data : []).map((item) => ({
          id: Number(item.id),
          date: item.date || "",
          water_cups: Number(item.water_cups || 0),
          sleep_hours: Number(item.sleep_hours || 0),
          workout_minutes: Number(item.workout_minutes || 0),
          mood: item.mood || "",
          notes: item.notes || "",
        }))
      );
    } catch (loadError) {
      console.error("Could not load health habits:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load health habits."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHabits();
  }, []);

  const addHabit = async () => {
    if (!date) {
      setError("Please select a date.");
      return;
    }

    setAdding(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/health/habits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date,
            water_cups: Number(waterCups || 0),
            sleep_hours: Number(sleepHours || 0),
            workout_minutes: Number(workoutMinutes || 0),
            mood,
            notes,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Could not save the health habit.");
      }

      setDate("");
      setWaterCups("");
      setSleepHours("");
      setWorkoutMinutes("");
      setMood("");
      setNotes("");
      setSuccess("Daily habit added successfully.");

      await fetchHabits();
    } catch (saveError) {
      console.error("Could not save habit:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the health habit."
      );
    } finally {
      setAdding(false);
    }
  };

  const deleteHabit = async (id: number) => {
    const confirmed = window.confirm("Delete this health habit entry?");

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/health/habits/${id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Could not delete the health habit.");
      }

      await fetchHabits();
    } catch (deleteError) {
      console.error("Could not delete habit:", deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the health habit."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const averages = useMemo(() => {
    if (habits.length === 0) {
      return { water: 0, sleep: 0, workout: 0 };
    }

    return {
      water:
        habits.reduce((sum, habit) => sum + habit.water_cups, 0) /
        habits.length,
      sleep:
        habits.reduce((sum, habit) => sum + habit.sleep_hours, 0) /
        habits.length,
      workout:
        habits.reduce((sum, habit) => sum + habit.workout_minutes, 0) /
        habits.length,
    };
  }, [habits]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">
          Daily tracking
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Health Habits
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Track water intake, sleep, workouts, mood, and notes to build a useful
          wellness history.
        </p>
      </header>

      {error ? <Notice message={error} error /> : null}
      {success ? <Notice message={success} /> : null}

      <section className="grid grid-cols-3 gap-3 sm:gap-4">
        <MiniMetric
          label="Avg Water"
          value={`${averages.water.toFixed(1)} cups`}
          icon="💧"
        />
        <MiniMetric
          label="Avg Sleep"
          value={`${averages.sleep.toFixed(1)} hrs`}
          icon="🌙"
        />
        <MiniMetric
          label="Avg Workout"
          value={`${averages.workout.toFixed(0)} min`}
          icon="🏃"
        />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-white">Add Daily Habit</h2>
        <p className="mt-2 text-sm text-slate-400">
          Record as much information as you have for the selected day.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={inputClassName}
          />

          <input
            type="number"
            min="0"
            value={waterCups}
            onChange={(event) => setWaterCups(event.target.value)}
            placeholder="Water cups"
            className={inputClassName}
          />

          <input
            type="number"
            min="0"
            step="0.5"
            value={sleepHours}
            onChange={(event) => setSleepHours(event.target.value)}
            placeholder="Sleep hours"
            className={inputClassName}
          />

          <input
            type="number"
            min="0"
            step="5"
            value={workoutMinutes}
            onChange={(event) => setWorkoutMinutes(event.target.value)}
            placeholder="Workout minutes"
            className={inputClassName}
          />

          <select
            value={mood}
            onChange={(event) => setMood(event.target.value)}
            className={inputClassName}
          >
            <option value="">Select mood</option>
            <option value="Great">Great</option>
            <option value="Good">Good</option>
            <option value="Okay">Okay</option>
            <option value="Tired">Tired</option>
            <option value="Stressed">Stressed</option>
          </select>

          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional notes"
            className={inputClassName}
          />
        </div>

        <button
          type="button"
          onClick={addHabit}
          disabled={adding}
          className="mt-5 w-full rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {adding ? "Adding..." : "Add Habit"}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Recent Habits</h2>
          <p className="mt-2 text-sm text-slate-400">
            {habits.length} total entries recorded.
          </p>
        </div>

        {loading ? (
          <div className="mt-5 space-y-4">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-xl bg-slate-800"
              />
            ))}
          </div>
        ) : habits.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/30 p-8 text-center">
            <p className="font-medium text-white">No habits added yet</p>
            <p className="mt-2 text-sm text-slate-400">
              Add your first daily entry using the form above.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {habits.map((habit) => (
              <article
                key={habit.id}
                className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">
                      {formatDate(habit.date)}
                    </h3>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-400 sm:grid-cols-3">
                      <span>💧 {habit.water_cups} cups</span>
                      <span>🌙 {habit.sleep_hours} hrs</span>
                      <span>🏃 {habit.workout_minutes} min</span>
                    </div>

                    <p className="mt-3 text-sm text-slate-400">
                      Mood:{" "}
                      <span className="font-medium text-slate-200">
                        {habit.mood || "Not recorded"}
                      </span>
                    </p>

                    {habit.notes ? (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                        {habit.notes}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteHabit(habit.id)}
                    disabled={deletingId === habit.id}
                    className="w-full shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50 sm:w-auto"
                  >
                    {deletingId === habit.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20";

function MiniMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-3 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-slate-400 sm:text-sm">{label}</p>
        <span aria-hidden="true">{icon}</span>
      </div>
      <p className="mt-2 break-words text-base font-bold text-white sm:text-2xl">
        {value}
      </p>
    </article>
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

function formatDate(value: string) {
  if (!value) {
    return "No date";
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}
