"use client";

import { useEffect, useState } from "react";

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

  const fetchHabits = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health/habits`);
      const data = await res.json();
      setHabits(data);
    } catch (error) {
      console.error("Could not load health habits:", error);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const addHabit = async () => {
    if (!date) {
      alert("Please select a date.");
      return;
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health/habits`, {
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
      });

      setDate("");
      setWaterCups("");
      setSleepHours("");
      setWorkoutMinutes("");
      setMood("");
      setNotes("");

      fetchHabits();
    } catch (error) {
      console.error("Could not save habit:", error);
      alert("Could not save health habit.");
    }
  };

  const deleteHabit = async (id: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health/habits/${id}`, {
        method: "DELETE",
      });

      fetchHabits();
    } catch (error) {
      console.error("Could not delete habit:", error);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">Health Habits</h1>

      <p className="mt-2 text-slate-400">
        Track your daily water intake, sleep, workouts, mood, and notes.
      </p>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <input
            type="number"
            value={waterCups}
            onChange={(e) => setWaterCups(e.target.value)}
            placeholder="Water cups"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <input
            type="number"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            placeholder="Sleep hours"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <input
            type="number"
            value={workoutMinutes}
            onChange={(e) => setWorkoutMinutes(e.target.value)}
            placeholder="Workout minutes"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="bg-slate-800 p-3 rounded-lg outline-none"
          >
            <option value="">Mood</option>
            <option value="Great">Great</option>
            <option value="Good">Good</option>
            <option value="Okay">Okay</option>
            <option value="Tired">Tired</option>
            <option value="Stressed">Stressed</option>
          </select>

          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />
        </div>

        <button
          onClick={addHabit}
          className="mt-5 bg-indigo-600 px-5 py-3 rounded-lg hover:bg-indigo-500"
        >
          Add Habit
        </button>
      </div>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <h2 className="text-xl font-semibold">Recent Habits</h2>

        {habits.length === 0 ? (
          <p className="mt-4 text-slate-400">No habits added yet.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="bg-slate-800 p-5 rounded-xl flex items-start justify-between gap-4"
              >
                <div>
                  <h3 className="font-semibold">{habit.date || "No Date"}</h3>

                  <p className="text-sm text-slate-400 mt-2">
                    Water: {habit.water_cups} cups · Sleep: {habit.sleep_hours} hrs ·
                    Workout: {habit.workout_minutes} min
                  </p>

                  <p className="text-sm text-slate-400 mt-1">
                    Mood: {habit.mood || "-"}
                  </p>

                  {habit.notes && (
                    <p className="text-sm text-slate-300 mt-3 whitespace-pre-wrap">
                      {habit.notes}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="bg-red-600 px-3 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}