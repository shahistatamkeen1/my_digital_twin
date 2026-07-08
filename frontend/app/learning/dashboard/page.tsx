"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

type ProgressTask = {
  id: number;
  topic: string;
  task: string;
  completed: boolean;
};

export default function LearningDashboardPage() {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [progressTasks, setProgressTasks] = useState<ProgressTask[]>([]);
  const [progressSummary, setProgressSummary] = useState({
    total_tasks: 0,
    completed_tasks: 0,
    remaining_tasks: 0,
    progress_percentage: 0,
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

  const loadProgress = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning-progress/`
      );
      const data = await res.json();
      setProgressTasks(data.tasks || []);
      setProgressSummary(
        data.summary || {
          total_tasks: 0,
          completed_tasks: 0,
          remaining_tasks: 0,
          progress_percentage: 0,
        }
      );
    } catch (error) {
      console.error("Progress load error:", error);
    }
  };

  useEffect(() => {
    loadItems();
    loadProgress();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm text-cyan-300">Learning Twin</p>
        <h1 className="mt-2 text-4xl font-bold">Learning Twin Dashboard</h1>
        <p className="mt-3 max-w-3xl text-slate-400">
          Your AI-powered learning command center for goals, progress, resources,
          and study planning.
        </p>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
          <StatCard label="Learning Goals" value={items.length.toString()} />
          <StatCard
            label="Completed Tasks"
            value={progressSummary.completed_tasks.toString()}
          />
          <StatCard
            label="Remaining Tasks"
            value={progressSummary.remaining_tasks.toString()}
          />
          <StatCard
            label="Progress"
            value={`${progressSummary.progress_percentage}%`}
          />
        </section>

        <section className="mt-8 rounded-2xl bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Learning Progress</h2>
          <p className="mt-2 text-slate-400">
            Track your progress across generated learning tasks.
          </p>

          <div className="mt-5 h-3 rounded-full bg-slate-700">
            <div
              className="h-3 rounded-full bg-cyan-500"
              style={{ width: `${progressSummary.progress_percentage}%` }}
            />
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            title="Learning Goals"
            description="Add and manage skills, certifications, and topics."
            href="/learning/goals"
          />
          <QuickAction
            title="AI Roadmap"
            description="Generate a 7-day and 30-day study plan."
            href="/learning/roadmap"
          />
          <QuickAction
            title="Resources"
            description="Find affordable learning resources."
            href="/learning/resources"
          />
          <QuickAction
            title="AI Chat"
            description="Ask your Learning Twin what to learn next."
            href="/learning/chat"
          />
        </section>

        <section className="mt-8 rounded-2xl bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Recent Learning Goals</h2>

          {items.length === 0 ? (
            <p className="mt-5 text-slate-400">No learning goals added yet.</p>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {items.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-5"
                >
                  <p className="text-sm text-cyan-300">{item.category}</p>
                  <h3 className="mt-1 text-xl font-semibold">{item.topic}</h3>
                  <p className="mt-3 text-sm text-slate-400">
                    {item.current_level} → {item.target_level}
                  </p>
                  <p className="mt-3 inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                    {item.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-2 text-3xl font-bold text-cyan-400">{value}</h3>
    </div>
  );
}

function QuickAction({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-slate-900 p-5 transition hover:bg-slate-800"
    >
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </Link>
  );
}