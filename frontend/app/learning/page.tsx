"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

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

type ResourceCardItem = {
  name: string;
  url: string;
  cost: string;
  type: string;
  description: string;
  why_useful: string;
};

type ProgressTask = {
  id: number;
  topic: string;
  task: string;
  completed: boolean;
};

export default function LearningTwinPage() {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [roadmap, setRoadmap] = useState("");
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const [resources, setResources] = useState<ResourceCardItem[]>([]);
  const [resourceSummary, setResourceSummary] = useState("");
  const [resourcesLoading, setResourcesLoading] = useState(false);

  const [progressTasks, setProgressTasks] = useState<ProgressTask[]>([]);
  const [progressSummary, setProgressSummary] = useState({
    total_tasks: 0,
    completed_tasks: 0,
    remaining_tasks: 0,
    progress_percentage: 0,
  });
  const [progressLoading, setProgressLoading] = useState(false);

  const [nextTask, setNextTask] = useState("");
  const [nextTaskLoading, setNextTaskLoading] = useState(false);

  const [chatMessage, setChatMessage] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

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

  const loadProgress = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning-progress/`
      );
      const data = await res.json();
      setProgressTasks(data.tasks || []);
      setProgressSummary(data.summary || progressSummary);
    } catch (error) {
      console.error("Progress load error:", error);
    }
  };

  useEffect(() => {
    loadItems();
    loadProgress();
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

  const generateResources = async () => {
    setResourcesLoading(true);
    setResources([]);
    setResourceSummary("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/resource-recommendations/`
      );

      const data = await res.json();
      setResources(data.resources || []);
      setResourceSummary(data.summary || "");
    } catch (error) {
      console.error("Resource cards error:", error);
      alert("Could not generate resources.");
    } finally {
      setResourcesLoading(false);
    }
  };

  const generateProgressTasks = async () => {
    setProgressLoading(true);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/learning-progress/generate`, {
        method: "POST",
      });

      await loadProgress();
    } catch (error) {
      console.error("Generate progress error:", error);
      alert("Could not generate learning tasks.");
    } finally {
      setProgressLoading(false);
    }
  };

  const toggleTask = async (task: ProgressTask) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning-progress/${task.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ completed: !task.completed }),
        }
      );

      await loadProgress();
    } catch (error) {
      console.error("Task update error:", error);
      alert("Could not update task.");
    }
  };

  const getNextTask = async () => {
    setNextTaskLoading(true);
    setNextTask("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning-progress/next-task`
      );

      const data = await res.json();
      setNextTask(data.next_task || "No next task generated.");
    } catch (error) {
      console.error("Next task error:", error);
      alert("Could not get next task.");
    } finally {
      setNextTaskLoading(false);
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

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm text-cyan-300">My Digital Twin</p>

        <h1 className="mt-2 text-4xl font-bold">Learning Twin</h1>

        <p className="mt-3 max-w-3xl text-slate-400">
          Track skills, certifications, learning goals, affordable resources,
          progress tasks, and AI-powered learning recommendations.
        </p>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
          <LearningStat
            label="Learning Goals"
            value={items.length.toString()}
          />
          <LearningStat
            label="Completed Tasks"
            value={progressSummary.completed_tasks.toString()}
          />
          <LearningStat
            label="Remaining Tasks"
            value={progressSummary.remaining_tasks.toString()}
          />
          <LearningStat
            label="Progress"
            value={`${progressSummary.progress_percentage}%`}
          />
        </section>

        <section className="mt-8 rounded-2xl bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-cyan-300">Learning Dashboard</p>
              <h2 className="mt-2 text-2xl font-bold">Progress Tracker</h2>
              <p className="mt-3 text-sm text-slate-400">
                Generate tasks from your goals, mark them complete, and track
                your learning progress.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={generateProgressTasks}
                disabled={progressLoading}
                className="rounded-lg bg-cyan-600 px-5 py-3 font-medium hover:bg-cyan-500 disabled:opacity-50"
              >
                {progressLoading ? "Generating..." : "Generate Tasks"}
              </button>

              <button
                onClick={getNextTask}
                disabled={nextTaskLoading}
                className="rounded-lg bg-violet-600 px-5 py-3 font-medium hover:bg-violet-500 disabled:opacity-50"
              >
                {nextTaskLoading ? "Thinking..." : "Next Best Task"}
              </button>
            </div>
          </div>

          <div className="mt-5 h-3 rounded-full bg-slate-700">
            <div
              className="h-3 rounded-full bg-cyan-500"
              style={{ width: `${progressSummary.progress_percentage}%` }}
            />
          </div>

          {nextTask && <ResponseBox content={nextTask} color="violet" />}

          {progressTasks.length === 0 ? (
            <p className="mt-5 text-slate-400">
              No learning tasks yet. Generate tasks from your saved goals.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {progressTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task)}
                  className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
                    task.completed
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-slate-700 bg-slate-800 hover:bg-slate-700"
                  }`}
                >
                  <span
                    className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded border ${
                      task.completed
                        ? "border-emerald-400 bg-emerald-500 text-white"
                        : "border-slate-500"
                    }`}
                  >
                    {task.completed ? "✓" : ""}
                  </span>

                  <div>
                    <p className="text-sm text-cyan-300">{task.topic}</p>
                    <h3
                      className={`mt-1 font-semibold ${
                        task.completed ? "line-through text-slate-400" : ""
                      }`}
                    >
                      {task.task}
                    </h3>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 space-y-6">
          <InsightPanel
            title="AI Study Roadmap"
            label="Learning Planner"
            description="Generate a personalized 7-day and 30-day roadmap based on your saved learning goals."
            buttonText={roadmapLoading ? "Generating..." : "Generate Roadmap"}
            buttonClass="bg-violet-600 hover:bg-violet-500"
            loading={roadmapLoading}
            onClick={generateRoadmap}
            content={roadmap}
            accent="violet"
          />

          <section className="rounded-2xl bg-slate-900 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-emerald-300">Resource Advisor</p>
                <h2 className="mt-2 text-2xl font-bold">
                  Best & Affordable Resources
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                  Generate clickable resource cards based on your saved learning
                  goals.
                </p>
              </div>

              <button
                onClick={generateResources}
                disabled={resourcesLoading}
                className="rounded-lg bg-emerald-600 px-5 py-3 font-medium hover:bg-emerald-500 disabled:opacity-50"
              >
                {resourcesLoading ? "Finding..." : "Generate Resources"}
              </button>
            </div>

            {resourceSummary && (
              <p className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-slate-200">
                {resourceSummary}
              </p>
            )}

            {resources.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {resources.map((resource, index) => (
                  <ResourceCard key={index} resource={resource} />
                ))}
              </div>
            )}
          </section>
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
              placeholder="Optional resource name e.g. AWS Skill Builder"
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-500"
            />

            <input
              value={form.resource_link}
              onChange={(e) =>
                setForm({
                  ...form,
                  resource_link: e.target.value,
                })
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

        <section className="mt-8 rounded-2xl bg-slate-900 p-6">
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

          {chatReply && <ResponseBox content={chatReply} color="cyan" />}
        </section>
      </div>
    </main>
  );
}

function LearningStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-2 text-3xl font-bold text-cyan-400">{value}</h3>
    </div>
  );
}

function ResourceCard({ resource }: { resource: ResourceCardItem }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      <h3 className="text-lg font-bold">{resource.name}</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
          {resource.cost}
        </span>

        <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300">
          {resource.type}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">
        {resource.description}
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {resource.why_useful}
      </p>

      {resource.url && (
        <a
          href={resource.url}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
        >
          Open Resource ↗
        </a>
      )}
    </div>
  );
}

function InsightPanel({
  title,
  label,
  description,
  buttonText,
  buttonClass,
  loading,
  onClick,
  content,
  accent,
}: {
  title: string;
  label: string;
  description: string;
  buttonText: string;
  buttonClass: string;
  loading: boolean;
  onClick: () => void;
  content: string;
  accent: "violet" | "emerald";
}) {
  return (
    <div className="rounded-2xl bg-slate-900 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p
            className={`text-sm ${
              accent === "violet" ? "text-violet-300" : "text-emerald-300"
            }`}
          >
            {label}
          </p>

          <h2 className="mt-2 text-2xl font-bold">{title}</h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            {description}
          </p>
        </div>

        <button
          onClick={onClick}
          disabled={loading}
          className={`rounded-lg px-5 py-3 font-medium disabled:opacity-50 ${buttonClass}`}
        >
          {buttonText}
        </button>
      </div>

      {content && <ResponseBox content={content} color={accent} />}
    </div>
  );
}

function ResponseBox({
  content,
  color,
}: {
  content: string;
  color: "cyan" | "violet" | "emerald";
}) {
  const colorClass =
    color === "violet"
      ? "border-violet-500/30 bg-violet-500/10"
      : color === "emerald"
      ? "border-emerald-500/30 bg-emerald-500/10"
      : "border-cyan-500/30 bg-cyan-500/10";

  return (
    <div
      className={`custom-scrollbar mt-5 max-h-[700px] overflow-y-auto rounded-xl border p-5 text-sm leading-7 text-slate-200 ${colorClass}`}
    >
      <div
        className="
          prose prose-invert max-w-none
          prose-headings:text-white
          prose-h2:mt-6 prose-h2:border-b prose-h2:border-slate-600 prose-h2:pb-2
          prose-h3:mt-5 prose-h3:text-cyan-300
          prose-p:my-3
          prose-ul:my-3
          prose-li:my-2
          prose-hr:my-6
          prose-hr:border-slate-600
        "
      >
        <ReactMarkdown
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-md bg-amber-400/15 px-2 py-1 font-semibold text-amber-300 underline decoration-amber-300/70 underline-offset-4 hover:bg-amber-400/25 hover:text-amber-200"
              >
                <span>{children}</span>
                <span className="ml-1 text-xs">↗</span>
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}