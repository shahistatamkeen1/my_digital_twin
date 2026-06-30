"use client";

import { useEffect, useState } from "react";

type LearningItem = {
  id: number;
  topic: string;
  category: string;
  current_level: string;
  target_level: string;
  resource: string;
  status: string;
  notes: string;
};

export default function LearningTwinPage() {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [chatMessage, setChatMessage] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [roadmap, setRoadmap] = useState("");
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const [form, setForm] = useState({
    topic: "",
    category: "",
    current_level: "Beginner",
    target_level: "Intermediate",
    resource: "",
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

  const askLearningTwin = async () => {
    if (!chatMessage.trim()) {
      alert("Please enter a question.");
      return;
    }

    setChatLoading(true);
    setChatReply("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning-chat/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: chatMessage }),
        }
      );

      const data = await res.json();
      setChatReply(data.reply || "No response generated.");
    } catch (error) {
      console.error("Learning chat error:", error);
      alert("Could not ask Learning Twin.");
    } finally {
      setChatLoading(false);
    }
  };

  const generateRoadmap = async () => {
    setRoadmapLoading(true);
    setRoadmap("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning-chat/roadmap`
      );

      const data = await res.json();
      setRoadmap(data.roadmap || "No roadmap generated.");
    } catch (error) {
      console.error("Learning roadmap error:", error);
      alert("Could not generate learning roadmap.");
    } finally {
      setRoadmapLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm text-cyan-300">My Digital Twin</p>

        <h1 className="mt-2 text-4xl font-bold">Learning Twin</h1>

        <p className="mt-3 max-w-3xl text-slate-400">
          Track skills, certifications, learning goals, study resources, AI
          study roadmaps, and personalized learning guidance.
        </p>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-slate-900 p-6">
            <h2 className="text-2xl font-bold">Ask Learning Twin</h2>

            <textarea
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask something like: What should I learn next for AI Engineer roles?"
              rows={5}
              className="mt-5 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-500"
            />

            <button
              onClick={askLearningTwin}
              disabled={chatLoading}
              className="mt-4 rounded-lg bg-cyan-600 px-5 py-3 font-medium hover:bg-cyan-500 disabled:opacity-50"
            >
              {chatLoading ? "Thinking..." : "Ask Learning Twin"}
            </button>

            {chatReply && (
              <div className="mt-5 whitespace-pre-wrap rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-5 text-sm leading-7 text-slate-200">
                {chatReply}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-slate-900 p-6">
            <h2 className="text-2xl font-bold">AI Study Roadmap</h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Generate a personalized 7-day and 30-day roadmap based on your
              saved learning goals.
            </p>

            <button
              onClick={generateRoadmap}
              disabled={roadmapLoading}
              className="mt-5 rounded-lg bg-violet-600 px-5 py-3 font-medium hover:bg-violet-500 disabled:opacity-50"
            >
              {roadmapLoading ? "Generating..." : "Generate Roadmap"}
            </button>

            {roadmap && (
              <div className="mt-5 max-h-[500px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-violet-500/30 bg-violet-500/10 p-5 text-sm leading-7 text-slate-200">
                {roadmap}
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Add Learning Goal</h2>

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
              placeholder="Resource e.g. AWS Skill Builder, YouTube, Udemy"
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-500"
            />

            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-500"
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
            {loading ? "Saving..." : "Add Learning Goal"}
          </button>
        </section>

        <section className="mt-8 rounded-2xl bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Learning Goals</h2>

          {items.length === 0 ? (
            <p className="mt-5 text-slate-400">No learning goals added yet.</p>
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
                      <h3 className="mt-1 text-xl font-semibold">
                        {item.topic}
                      </h3>
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
                      {item.resource}
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