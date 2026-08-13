"use client";

import { useCallback, useEffect, useState } from "react";

import AppShell from "@/components/AppShell";
import { ApiError, apiFetch, requireApiSuccess } from "@/lib/api";

type Reflection = {
  id: number;
  agent_name: string;
  reflection_type: string;
  wins: string[];
  concerns: string[];
  recommendation: string;
  summary: string;
  confidence_score: number;
  created_at: string;
};

type GenerateResponse = {
  message: string;
  count: number;
};

export default function AgentReflectionsPage() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadReflections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/agent-reflections/", {
        cache: "no-store",
      });
      await requireApiSuccess(response, "Agent reflections could not be loaded.");
      const data = (await response.json()) as Reflection[];
      if (!Array.isArray(data)) {
        throw new Error("The reflections service returned an invalid response.");
      }
      setReflections(data);
    } catch (requestError) {
      console.error("Reflections error:", requestError);
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReflections();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReflections]);

  const generateReflections = async () => {
    setGenerating(true);
    setError(null);
    setMessage(null);
    try {
      const response = await apiFetch("/api/agent-reflections/generate", {
        method: "POST",
      });
      await requireApiSuccess(
        response,
        "Agent reflections could not be generated."
      );
      const result = (await response.json()) as GenerateResponse;
      setMessage(
        result.count > 0
          ? `${result.count} agent reflection${result.count === 1 ? "" : "s"} ready.`
          : "No reflections were generated because learned agent profiles are not available yet."
      );
      await loadReflections();
    } catch (requestError) {
      console.error("Generate reflections error:", requestError);
      setError(errorMessage(requestError));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-cyan-300">Digital Twin Intelligence</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Agent Reflections
            </h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Generate and review self-reflections from each learned Digital
              Twin profile.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadReflections()}
              disabled={loading || generating}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button
              type="button"
              onClick={() => void generateReflections()}
              disabled={loading || generating}
              className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? "Generating…" : "Generate reflections"}
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm leading-6 text-rose-100"
          >
            <p className="font-semibold">Reflections request failed</p>
            <p className="mt-2 break-words">{error}</p>
          </div>
        )}

        {message && !error && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"
          >
            {message}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl bg-slate-900 p-8 text-slate-300">
            Loading reflections…
          </div>
        ) : !error && reflections.length === 0 ? (
          <EmptyReflections onGenerate={() => void generateReflections()} busy={generating} />
        ) : !error ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {reflections.map((reflection) => (
              <ReflectionCard key={reflection.id} reflection={reflection} />
            ))}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function EmptyReflections({
  onGenerate,
  busy,
}: {
  onGenerate: () => void;
  busy: boolean;
}) {
  return (
    <section className="mt-8 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center sm:p-12">
      <div className="text-4xl" aria-hidden="true">🔄</div>
      <h2 className="mt-4 text-xl font-bold">No reflections yet</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
        Reflections are generated from learned agent profiles. If generation
        returns zero, create agent memories through Personal HQ or an
        AI-powered interaction, refresh Profiles, and try again.
      </p>
      <button
        type="button"
        onClick={onGenerate}
        disabled={busy}
        className="mt-5 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
      >
        {busy ? "Generating…" : "Generate reflections"}
      </button>
    </section>
  );
}

function ReflectionCard({ reflection }: { reflection: Reflection }) {
  const theme = getTheme(reflection.agent_name);
  return (
    <article className={`rounded-2xl border ${theme.border} ${theme.bg} p-5 sm:p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-3xl" aria-hidden="true">{theme.icon}</div>
          <h2 className="mt-3 text-xl font-bold sm:text-2xl">{reflection.agent_name}</h2>
          <p className="mt-1 text-xs capitalize text-slate-500">
            {reflection.reflection_type} reflection
          </p>
        </div>
        <div className="rounded-xl bg-slate-900 px-4 py-3 text-center">
          <p className="text-xs text-slate-400">Confidence</p>
          <p className={`text-2xl font-bold sm:text-3xl ${theme.text}`}>
            {reflection.confidence_score}%
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-7 text-slate-300">{reflection.summary}</p>
      <ListSection title="Wins" titleClass={theme.text} icon="✅" items={reflection.wins} />
      <ListSection title="Concerns" titleClass="text-yellow-300" icon="⚠️" items={reflection.concerns} />

      <div className="mt-5">
        <p className="text-sm font-medium text-cyan-300">Recommendation</p>
        <div className="mt-3 rounded-xl bg-slate-900 p-4 text-sm leading-6 text-slate-300">
          {reflection.recommendation}
        </div>
      </div>
      <p className="mt-5 text-xs text-slate-500">{formatDate(reflection.created_at)}</p>
    </article>
  );
}

function ListSection({ title, titleClass, icon, items }: { title: string; titleClass: string; icon: string; items: string[] }) {
  return (
    <div className="mt-5">
      <p className={`text-sm font-medium ${titleClass}`}>{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {items.map((item, index) => <li key={`${title}-${index}`}>{icon} {item}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No {title.toLowerCase()} recorded.</p>
      )}
    </div>
  );
}

function getTheme(agent: string) {
  if (agent.includes("Career")) return { icon: "💼", border: "border-blue-500/30", bg: "bg-blue-500/5", text: "text-blue-300" };
  if (agent.includes("Finance")) return { icon: "💰", border: "border-green-500/30", bg: "bg-green-500/5", text: "text-green-300" };
  if (agent.includes("Health")) return { icon: "❤️", border: "border-pink-500/30", bg: "bg-pink-500/5", text: "text-pink-300" };
  return { icon: "📚", border: "border-violet-500/30", bg: "bg-violet-500/5", text: "text-violet-300" };
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.requestId ? `${error.message} Reference: ${error.requestId}` : error.message;
  }
  return error instanceof Error ? error.message : "The reflections request could not be completed.";
}
