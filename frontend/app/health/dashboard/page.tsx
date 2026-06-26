"use client";

import { useEffect, useState } from "react";

type HealthSummary = {
  avg_water: number;
  avg_sleep: number;
  avg_workout: number;
  wellness_score: number;
  habit_count: number;
  water_goal: number;
  sleep_goal: number;
  workout_goal: number;
};

export default function HealthDashboardPage() {
  const [summary, setSummary] = useState<HealthSummary>({
    avg_water: 0,
    avg_sleep: 0,
    avg_workout: 0,
    wellness_score: 0,
    habit_count: 0,
    water_goal: 8,
    sleep_goal: 8,
    workout_goal: 30,
  });

  const fetchSummary = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/health/summary`
      );

      const data = await res.json();
      setSummary(data);
    } catch (error) {
      console.error("Could not load health summary:", error);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">Health Twin Dashboard</h1>

      <p className="mt-2 text-slate-400">
        Your wellness overview based on daily habits and health memory.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-slate-900 p-5 rounded-xl">
          <p className="text-slate-400 text-sm">Avg Water Intake</p>
          <h2 className="text-4xl font-bold mt-2">
            {summary.avg_water} cups
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Goal: {summary.water_goal} cups
          </p>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl">
          <p className="text-slate-400 text-sm">Avg Sleep</p>
          <h2 className="text-4xl font-bold mt-2">
            {summary.avg_sleep} hrs
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Goal: {summary.sleep_goal} hrs
          </p>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl">
          <p className="text-slate-400 text-sm">Avg Workout</p>
          <h2 className="text-4xl font-bold mt-2 text-green-400">
            {summary.avg_workout} min
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Goal: {summary.workout_goal} min
          </p>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl">
          <p className="text-slate-400 text-sm">Wellness Score</p>
          <h2 className="text-4xl font-bold mt-2 text-indigo-400">
            {summary.wellness_score}%
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Based on {summary.habit_count} entries
          </p>
        </div>
      </div>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <h2 className="text-xl font-semibold">Health Progress</h2>

        <div className="mt-5 space-y-5">
          <ProgressBar
            label="Water Goal"
            value={summary.avg_water}
            goal={summary.water_goal}
            suffix="cups"
          />

          <ProgressBar
            label="Sleep Goal"
            value={summary.avg_sleep}
            goal={summary.sleep_goal}
            suffix="hrs"
          />

          <ProgressBar
            label="Workout Goal"
            value={summary.avg_workout}
            goal={summary.workout_goal}
            suffix="min"
          />
        </div>
      </div>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <h2 className="text-xl font-semibold">AI Health Insight</h2>

        <p className="mt-3 text-slate-400">
          Your Health Twin is using your habit history and health memory to
          calculate wellness trends. AI insights will be added next.
        </p>
      </div>
    </main>
  );
}

function ProgressBar({
  label,
  value,
  goal,
  suffix,
}: {
  label: string;
  value: number;
  goal: number;
  suffix: string;
}) {
  const percent = goal > 0 ? Math.min(Math.round((value / goal) * 100), 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-slate-400">
          {value} / {goal} {suffix} · {percent}%
        </span>
      </div>

      <div className="mt-2 h-3 bg-slate-800 rounded-full">
        <div
          className="h-3 bg-indigo-500 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}