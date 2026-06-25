"use client";

import { useEffect, useState } from "react";

type SavingsGoal = {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
};

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  const fetchGoals = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/finance/savings-goals`
      );

      const data = await res.json();
      setGoals(data);
    } catch (error) {
      console.error("Could not load savings goals:", error);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const addGoal = async () => {
    if (!title || !targetAmount) {
      alert("Please enter title and target amount.");
      return;
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/finance/savings-goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          target_amount: Number(targetAmount),
          current_amount: Number(currentAmount || 0),
          deadline,
        }),
      });

      setTitle("");
      setTargetAmount("");
      setCurrentAmount("");
      setDeadline("");

      fetchGoals();
    } catch (error) {
      console.error("Could not save goal:", error);
      alert("Could not save goal.");
    }
  };

  const deleteGoal = async (id: number) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/finance/savings-goals/${id}`,
        {
          method: "DELETE",
        }
      );

      fetchGoals();
    } catch (error) {
      console.error("Could not delete goal:", error);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">Savings Goals</h1>

      <p className="mt-2 text-slate-400">
        Set financial goals and track your progress.
      </p>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Goal Title"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <input
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="Target Amount"
            type="number"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <input
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            placeholder="Current Amount"
            type="number"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <input
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="Deadline"
            type="date"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <button
            onClick={addGoal}
            className="bg-indigo-600 px-4 py-3 rounded-lg hover:bg-indigo-500"
          >
            Add Goal
          </button>
        </div>
      </div>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <h2 className="text-xl font-semibold">Your Goals</h2>

        {goals.length === 0 ? (
          <p className="mt-4 text-slate-400">No savings goals added yet.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {goals.map((goal) => {
              const progress = Math.min(
                Math.round((goal.current_amount / goal.target_amount) * 100),
                100
              );

              return (
                <div key={goal.id} className="bg-slate-800 p-5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{goal.title}</h3>
                      <p className="text-sm text-slate-400">
                        ${goal.current_amount} saved of ${goal.target_amount}
                      </p>
                      {goal.deadline && (
                        <p className="text-xs text-slate-500 mt-1">
                          Deadline: {goal.deadline}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="bg-red-600 px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-4 h-3 bg-slate-900 rounded-full">
                    <div
                      className="h-3 bg-green-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="mt-2 text-sm text-slate-400">
                    {progress}% complete
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}