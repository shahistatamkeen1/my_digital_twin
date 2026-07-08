"use client";

import { useEffect, useState } from "react";

type LearningItem = {
  id: number;
  topic: string;
  category: string;
  current_level: string;
  target_level: string;
  resource: string;
  resource_link: string;
  status: string;
  notes: string;
};

export default function LearningGoalsPage() {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    topic: "",
    category: "",
    current_level: "Beginner",
    target_level: "Intermediate",
    resource: "",
    resource_link: "",
    status: "In Progress",
    notes: "",
  });

  const loadItems = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/learning/`);
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error("Learning load error:", error);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const addItem = async () => {
    if (!form.topic || !form.category) {
      alert("Please enter topic and category.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/learning/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to add learning item");

      setForm({
        topic: "",
        category: "",
        current_level: "Beginner",
        target_level: "Intermediate",
        resource: "",
        resource_link: "",
        status: "In Progress",
        notes: "",
      });

      await loadItems();
    } catch (error) {
      console.error("Learning add error:", error);
      alert("Could not add learning item.");
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/learning/${id}`, {
        method: "DELETE",
      });

      await loadItems();
    } catch (error) {
      console.error("Learning delete error:", error);
      alert("Could not delete learning item.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm text-cyan-300">Learning Twin</p>
        <h1 className="mt-2 text-4xl font-bold">Learning Memory</h1>
        <p className="mt-3 max-w-3xl text-slate-400">
  Store and manage your learning profile, skill goals, resources, progress,
  and study context used by your AI Learning Twin.
</p>

        <section className="mt-8 rounded-2xl bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Add Learning Item</h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="Topic e.g. AWS Solutions Architect"
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-500"
            />

            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Category e.g. Cloud Certification"
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-500"
            />

            <select
              value={form.current_level}
              onChange={(e) =>
                setForm({ ...form, current_level: e.target.value })
              }
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-500"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>

            <select
              value={form.target_level}
              onChange={(e) =>
                setForm({ ...form, target_level: e.target.value })
              }
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-500"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Job Ready</option>
            </select>

            <input
              value={form.resource}
              onChange={(e) => setForm({ ...form, resource: e.target.value })}
              placeholder="Optional resource name e.g. AWS Skill Builder"
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-500"
            />

            <input
              value={form.resource_link}
              onChange={(e) =>
                setForm({ ...form, resource_link: e.target.value })
              }
              placeholder="Optional resource URL e.g. https://skillbuilder.aws"
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-500"
            />

            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-500 md:col-span-2"
            >
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Paused</option>
            </select>
          </div>

          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes e.g. Study 30 minutes daily and finish practice exam by Sunday"
            rows={4}
            className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-500"
          />

          <button
            onClick={addItem}
            disabled={loading}
            className="mt-5 rounded-lg bg-cyan-600 px-5 py-3 font-medium hover:bg-cyan-500 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Add Learning Item"}
          </button>
        </section>

        <section className="mt-8 rounded-2xl bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Your Learning Items</h2>

          {items.length === 0 ? (
            <p className="mt-5 text-slate-400">No learning items added yet.</p>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-cyan-300">{item.category}</p>
                      <h3 className="mt-1 text-xl font-semibold">{item.topic}</h3>
                    </div>

                    <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-slate-900 p-3">
                      <p className="text-slate-500">Current</p>
                      <p className="mt-1 text-white">{item.current_level}</p>
                    </div>

                    <div className="rounded-lg bg-slate-900 p-3">
                      <p className="text-slate-500">Target</p>
                      <p className="mt-1 text-white">{item.target_level}</p>
                    </div>
                  </div>

                  {item.resource && (
                    <p className="mt-4 text-sm text-slate-300">
                      <span className="text-slate-500">Resource: </span>
                      {item.resource_link ? (
                        <a
                          href={item.resource_link}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-amber-300 underline hover:text-amber-200"
                        >
                          {item.resource} ↗
                        </a>
                      ) : (
                        item.resource
                      )}
                    </p>
                  )}

                  {item.notes && (
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {item.notes}
                    </p>
                  )}

                  <button
                    onClick={() => deleteItem(item.id)}
                    className="mt-5 rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}