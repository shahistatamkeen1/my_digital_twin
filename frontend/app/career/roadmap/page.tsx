"use client";

import { useEffect, useState } from "react";

type RoadmapItem = {
  id: number;
  week: string;
  title: string;
  description: string;
  tasks: string;
  completed: boolean;
};

export default function RoadmapPage() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    week: "",
    title: "",
    description: "",
    tasks: "",
  });

  const fetchRoadmap = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roadmap/`);
    const data = await res.json();
    setItems(data);
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const addItem = async () => {
    if (!form.week || !form.title) {
      alert("Week and title are required.");
      return;
    }

    setLoading(true);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roadmap/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          completed: false,
        }),
      });

      setForm({
        week: "",
        title: "",
        description: "",
        tasks: "",
      });

      fetchRoadmap();
    } catch (error) {
      alert("Could not add roadmap item.");
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (item: RoadmapItem) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roadmap/${item.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        completed: !item.completed,
      }),
    });

    fetchRoadmap();
  };

  const deleteItem = async (id: number) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roadmap/${id}`, {
      method: "DELETE",
    });

    fetchRoadmap();
  };

  const generateSampleRoadmap = async () => {

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roadmap/`, {
  method: "DELETE",
});
    const sample = [
      {
        week: "Week 1",
        title: "Strengthen Core Resume and Skills",
        description:
          "Focus on improving your resume, GitHub, and core software development skills.",
        tasks:
          "Update resume bullets with measurable impact\nClean GitHub README\nPractice 5 DSA problems\nReview Python and JavaScript fundamentals",
      },
      {
        week: "Week 2",
        title: "Build AI Career Project Depth",
        description:
          "Improve your AI project story and add stronger agentic AI concepts.",
        tasks:
          "Add Career Memory explanation\nImprove Digital Twin dashboard\nWrite project README\nPractice explaining AI agent architecture",
      },
      {
        week: "Week 3",
        title: "Apply Strategically",
        description:
          "Focus on targeted applications instead of random high-volume applying.",
        tasks:
          "Apply to 20 matching roles\nCreate ATS resume versions\nTrack every application\nSend 5 recruiter messages",
      },
      {
        week: "Week 4",
        title: "Interview Preparation and Portfolio Polish",
        description:
          "Prepare for interviews and polish the project for recruiter visibility.",
        tasks:
          "Practice behavioral answers\nPractice system design basics\nRecord project demo video\nDeploy frontend and backend",
      },
    ];

    for (const item of sample) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roadmap/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...item,
          completed: false,
        }),
      });
    }

    fetchRoadmap();
  };

  const generatePersonalizedRoadmap = async () => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roadmap/generate`, {
      method: "POST",
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    alert("Personalized roadmap generated successfully.");
    fetchRoadmap();
  } catch (error) {
    alert("Could not generate personalized roadmap.");
  }
};

const clearRoadmap = async () => {
  const confirmClear = confirm("Are you sure you want to clear the entire roadmap?");

  if (!confirmClear) return;

  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roadmap/`, {
    method: "DELETE",
  });

  fetchRoadmap();
};

  const completedCount = items.filter((item) => item.completed).length;
  const progress =
    items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100);

  return (
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">Career Roadmap</h1>

      <p className="mt-2 text-slate-400">
        Build and track your 30-day career growth plan.
      </p>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Roadmap Progress</h2>

        <p className="mt-4 text-4xl font-bold text-indigo-400 sm:text-5xl">
          {progress}%
        </p>

        <div className="mt-4 h-3 w-full rounded-full bg-slate-800">
          <div
            className="h-3 rounded-full bg-indigo-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-slate-400">
          {completedCount} of {items.length} roadmap items completed.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <h2 className="text-xl font-semibold">Add Roadmap Item</h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex">
  <button
    onClick={generatePersonalizedRoadmap}
    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500"
  >
    Generate Personalized Roadmap
  </button>

  <button
    onClick={generateSampleRoadmap}
    className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
  >
    Generate Sample Plan
  </button>

  <button
    onClick={clearRoadmap}
    className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
  >
    Clear Roadmap
  </button>
</div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <input
            name="week"
            value={form.week}
            onChange={handleChange}
            placeholder="Week 1"
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Learn Docker Basics"
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe this roadmap step..."
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40 lg:col-span-2"
            rows={3}
          />

          <textarea
            name="tasks"
            value={form.tasks}
            onChange={handleChange}
            placeholder="Add tasks, one per line..."
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40 lg:col-span-2"
            rows={4}
          />
        </div>

        <button
          onClick={addItem}
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50 sm:w-auto"
        >
          {loading ? "Adding..." : "Add Roadmap Item"}
        </button>
      </div>

      <div className="mt-8 space-y-6">
        {items.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
            <p className="text-slate-400">
              No roadmap items yet. Add one manually or generate the sample 30-day plan.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6 border border-slate-800"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-indigo-400 text-sm font-medium">
                    {item.week}
                  </p>

                  <h2
                    className={`text-xl font-semibold mt-1 ${
                      item.completed ? "line-through text-slate-500" : ""
                    }`}
                  >
                    {item.title}
                  </h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => toggleComplete(item)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      item.completed
                        ? "bg-green-600"
                        : "bg-slate-700 hover:bg-slate-600"
                    }`}
                  >
                    {item.completed ? "Completed" : "Mark Complete"}
                  </button>

                  <button
                    onClick={() => deleteItem(item.id)}
                    className="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="mt-4 break-words leading-6 text-slate-300">
                {item.description}
              </p>

              {item.tasks && (
                <div className="mt-5">
                  <h3 className="font-semibold">Tasks</h3>

                  <ul className="mt-2 list-disc space-y-2 break-words pl-5 text-sm leading-6 text-slate-300">
                    {item.tasks.split("\n").map((task, index) => (
                      <li key={index}>{task}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}