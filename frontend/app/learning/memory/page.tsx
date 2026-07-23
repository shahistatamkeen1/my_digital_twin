"use client";

import { apiFetch } from "@/lib/api";

import type { ReactNode } from "react";
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

type LearningForm = Omit<LearningItem, "id">;

const initialForm: LearningForm = {
  topic: "",
  category: "",
  current_level: "Beginner",
  target_level: "Intermediate",
  resource: "",
  resource_link: "",
  status: "In Progress",
  notes: "",
};

export default function LearningMemoryPage() {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [form, setForm] = useState<LearningForm>(initialForm);
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadItems = async () => {
    setError("");

    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning/`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("Could not load Learning Memory.");
      }

      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error("Learning load error:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load Learning Memory."
      );
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const updateForm = (field: keyof LearningForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addItem = async () => {
    if (!form.topic.trim() || !form.category.trim()) {
      setError("Please enter both a topic and category.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            topic: form.topic.trim(),
            category: form.category.trim(),
            resource: form.resource.trim(),
            resource_link: form.resource_link.trim(),
            notes: form.notes.trim(),
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Could not add the learning item.");
      }

      setForm(initialForm);
      setSuccess("Learning item added successfully.");
      await loadItems();
    } catch (saveError) {
      console.error("Learning add error:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not add the learning item."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: number) => {
    const confirmed = window.confirm("Delete this learning item?");

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");

    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error("Could not delete the learning item.");
      }

      await loadItems();
    } catch (deleteError) {
      console.error("Learning delete error:", deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the learning item."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
          Personalized learning context
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Learning Memory
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          Store your learning profile, skill goals, resources, progress status,
          and study context used by the Learning Twin.
        </p>
      </header>

      {error ? <Notice message={error} error /> : null}
      {success ? <Notice message={success} /> : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-white">
          Add Learning Item
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Add one skill, topic, certification, or project goal at a time.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Topic">
            <input
              value={form.topic}
              onChange={(event) => updateForm("topic", event.target.value)}
              placeholder="AWS Solutions Architect"
              className={inputClassName}
            />
          </Field>

          <Field label="Category">
            <input
              value={form.category}
              onChange={(event) => updateForm("category", event.target.value)}
              placeholder="Cloud Certification"
              className={inputClassName}
            />
          </Field>

          <Field label="Current Level">
            <select
              value={form.current_level}
              onChange={(event) =>
                updateForm("current_level", event.target.value)
              }
              className={inputClassName}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </Field>

          <Field label="Target Level">
            <select
              value={form.target_level}
              onChange={(event) =>
                updateForm("target_level", event.target.value)
              }
              className={inputClassName}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Job Ready</option>
            </select>
          </Field>

          <Field label="Resource Name">
            <input
              value={form.resource}
              onChange={(event) => updateForm("resource", event.target.value)}
              placeholder="AWS Skill Builder"
              className={inputClassName}
            />
          </Field>

          <Field label="Resource URL">
            <input
              type="url"
              value={form.resource_link}
              onChange={(event) =>
                updateForm("resource_link", event.target.value)
              }
              placeholder="https://skillbuilder.aws"
              className={inputClassName}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Status">
              <select
                value={form.status}
                onChange={(event) => updateForm("status", event.target.value)}
                className={inputClassName}
              >
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Paused</option>
              </select>
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(event) => updateForm("notes", event.target.value)}
                placeholder="Study 30 minutes daily and finish the practice exam by Sunday."
                rows={4}
                className={inputClassName}
              />
            </Field>
          </div>
        </div>

        <button
          type="button"
          onClick={addItem}
          disabled={saving}
          className="mt-5 w-full rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {saving ? "Saving..." : "Add Learning Item"}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Your Learning Items
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {items.length} saved learning goals.
          </p>
        </div>

        {loadingItems ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-xl bg-slate-800"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No learning items added yet"
            description="Use the form above to create your first skill or certification goal."
          />
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-700 bg-slate-800/70 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-cyan-300">
                      {item.category}
                    </p>

                    <h3 className="mt-2 break-words text-lg font-semibold text-white">
                      {item.topic}
                    </h3>
                  </div>

                  <StatusBadge status={item.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <LevelCard label="Current" value={item.current_level} />
                  <LevelCard label="Target" value={item.target_level} />
                </div>

                {item.resource ? (
                  <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Resource
                    </p>

                    {item.resource_link ? (
                      <a
                        href={item.resource_link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-2 inline-flex break-all text-sm font-semibold text-amber-300 underline decoration-amber-300/50 underline-offset-4 transition hover:text-amber-200"
                      >
                        {item.resource} ↗
                      </a>
                    ) : (
                      <p className="mt-2 text-sm text-slate-300">
                        {item.resource}
                      </p>
                    )}
                  </div>
                ) : null}

                {item.notes ? (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                    {item.notes}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  disabled={deletingId === item.id}
                  className="mt-5 w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50 sm:w-auto"
                >
                  {deletingId === item.id ? "Deleting..." : "Delete"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase();

  const className =
    normalized === "completed"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : normalized === "in progress"
        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
        : normalized === "paused"
          ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-300";

  return (
    <span
      className={`shrink-0 rounded-full border px-3 py-1 text-xs ${className}`}
    >
      {status || "Not Started"}
    </span>
  );
}

function LevelCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-950/60 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-white">{value || "Not set"}</p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/30 p-8 text-center">
      <p className="font-medium text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
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
