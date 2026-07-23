"use client";

import { apiFetch } from "@/lib/api";

import { useEffect, useState } from "react";

type Memory = {
  id?: number;
  career_goal: string;
  target_role: string;
  current_skills: string;
  skills_to_learn: string;
  notes: string;
};

export default function MemoryPage() {
  const [memory, setMemory] = useState<Memory>({
    career_goal: "",
    target_role: "",
    current_skills: "",
    skills_to_learn: "",
    notes: "",
  });

  const [saved, setSaved] = useState(false);

  const fetchMemory = async () => {
    const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/memory/`);
    const data = await res.json();

    if (data) {
      setMemory({
        career_goal: data.career_goal || "",
        target_role: data.target_role || "",
        current_skills: data.current_skills || "",
        skills_to_learn: data.skills_to_learn || "",
        notes: data.notes || "",
      });
    }
  };

  useEffect(() => {
    fetchMemory();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setMemory({
      ...memory,
      [e.target.name]: e.target.value,
    });
  };

  const saveMemory = async () => {
    await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/memory/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(memory),
    });

    setSaved(true);
    fetchMemory();
  };

  return (
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">Career Memory</h1>

      <p className="mt-2 text-slate-400">
        Store your long-term career goals so your Digital Twin can remember them.
      </p>

      <div className="mt-8 max-w-3xl rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6 space-y-5">
        <div>
          <label className="block mb-2 text-sm text-slate-300">
            Career Goal
          </label>
          <textarea
            name="career_goal"
            value={memory.career_goal}
            onChange={handleChange}
            placeholder="Example: I want to become an AI Engineer in the next 6 months."
            rows={3}
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm text-slate-300">
            Target Role
          </label>
          <input
            name="target_role"
            value={memory.target_role}
            onChange={handleChange}
            placeholder="AI Engineer"
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm text-slate-300">
            Current Skills
          </label>
          <textarea
            name="current_skills"
            value={memory.current_skills}
            onChange={handleChange}
            placeholder="Python, FastAPI, React, SQL, OpenAI API"
            rows={3}
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm text-slate-300">
            Skills to Learn
          </label>
          <textarea
            name="skills_to_learn"
            value={memory.skills_to_learn}
            onChange={handleChange}
            placeholder="LangGraph, RAG, Vector Databases, Docker, AWS"
            rows={3}
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm text-slate-300">
            Notes
          </label>
          <textarea
            name="notes"
            value={memory.notes}
            onChange={handleChange}
            placeholder="Any career notes your twin should remember."
            rows={4}
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <button
          onClick={saveMemory}
          className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 sm:w-auto"
        >
          Save Memory
        </button>

        {saved && (
          <p className="rounded-lg bg-green-500/10 p-3 text-green-400">
            Career memory saved successfully.
          </p>
        )}
      </div>
    </>
  );
}