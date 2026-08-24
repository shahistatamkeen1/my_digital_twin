"use client";

import { useCallback, useEffect, useState } from "react";

import AppShell from "@/components/AppShell";
import { ApiError, apiFetch, requireApiSuccess } from "@/lib/api";

type AgentProfile = {
  id: number;
  agent_name: string;
  learned_preferences: {
    preferred_roles?: string[];
    preferred_technologies?: string[];
    primary_goals?: string[];
  };
  behavior_patterns: {
    memory_count?: number;
    agent_activity_level?: string;
    learned_pattern?: string;
    confidence_evolution?: {
      base_confidence?: number;
      memory_bonus?: number;
      goal_bonus?: number;
      technology_bonus?: number;
    };
  };
  recurring_goals: string[];
  recurring_risks: string[];
  decision_style: string;
  confidence_score: number;
};

export default function TwinPersonalityPage() {
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/agent-profiles/", {
        cache: "no-store",
      });
      await requireApiSuccess(res, "Agent profiles could not be loaded.");

      const data = (await res.json()) as AgentProfile[];
      if (!Array.isArray(data)) {
        throw new Error("The profile service returned an invalid response.");
      }
      setProfiles(data);
    } catch (requestError) {
      console.error("Agent profiles error:", requestError);
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfiles();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProfiles]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-cyan-300">Digital Twin Intelligence</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Agent Profiles
            </h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              View learned goals, preferences, risks, and confidence growth
              across your AI agents.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadProfiles()}
            disabled={loading}
            className="self-start rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh profiles"}
          </button>
        </div>

        {!loading && error && (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm leading-6 text-rose-100"
          >
            <p className="font-semibold">Profiles could not load</p>
            <p className="mt-2 break-words">{error}</p>
            <button
              type="button"
              onClick={() => void loadProfiles()}
              className="mt-4 rounded-lg border border-rose-300/40 px-4 py-2 font-semibold text-rose-100 hover:bg-rose-500/20"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl bg-slate-900 p-8">
            Loading personality profiles...
          </div>
        ) : !error && profiles.length > 0 ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {profiles.map((profile) => (
              <AgentProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : !error ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center sm:p-12">
            <div className="text-4xl" aria-hidden="true">🧠</div>
            <h2 className="mt-4 text-xl font-bold">No learned profiles yet</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Agent profiles are created from saved agent memories. Run an
              AI-powered Personal HQ or Advisor interaction first, then refresh
              this page.
            </p>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function AgentProfileCard({ profile }: { profile: AgentProfile }) {
  const preferences = profile.learned_preferences || {};
  const patterns = profile.behavior_patterns || {};
  const confidence = patterns.confidence_evolution || {};
  const risks = profile.recurring_risks?.slice(0, 3) || [];

  const theme = getAgentTheme(profile.agent_name);

  return (
    <div
      className={`rounded-2xl border ${theme.border} ${theme.bg} p-6 shadow-lg`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-3xl">{theme.icon}</div>

          <h2 className="mt-3 text-2xl font-bold">{profile.agent_name}</h2>

          <p className={`mt-2 text-sm ${theme.text}`}>
            {profile.decision_style}
          </p>
        </div>

        <div className={`rounded-2xl ${theme.badge} px-5 py-3 text-right`}>
          <p className={`text-xs ${theme.text}`}>Confidence</p>
          <h3 className={`text-3xl font-bold ${theme.text}`}>
            {profile.confidence_score}%
          </h3>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <InfoBox title="Activity Level" value={patterns.agent_activity_level || "Early"} />
        <InfoBox title="Memory Count" value={String(patterns.memory_count || 0)} />
      </div>

      <Section title="Preferred Roles" color={theme.text}>
        <PillList items={preferences.preferred_roles || []} />
      </Section>

      <Section title="Preferred Technologies" color={theme.text}>
        <PillList items={preferences.preferred_technologies || []} />
      </Section>

      <Section title="Primary Goals" color="text-green-300">
        <PillList items={preferences.primary_goals || profile.recurring_goals || []} />
      </Section>

      <Section title="Confidence Evolution" color={theme.text}>
        <div className="grid gap-3 md:grid-cols-4">
          <MiniStat label="Base" value={confidence.base_confidence || 0} />
          <MiniStat label="Memory" value={confidence.memory_bonus || 0} />
          <MiniStat label="Goal" value={confidence.goal_bonus || 0} />
          <MiniStat label="Tech" value={confidence.technology_bonus || 0} />
        </div>
      </Section>

      <Section title="Learned Pattern" color="text-violet-300">
        <p className="rounded-xl bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
          {patterns.learned_pattern || "Not enough memory data yet."}
        </p>
      </Section>

      <Section title="Top Risks" color="text-yellow-300">
        {risks.length ? (
          <ul className="space-y-2 rounded-xl bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
            {risks.map((risk, index) => (
              <li key={index}>• {risk}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No recurring risks found yet.</p>
        )}
      </Section>
    </div>
  );
}

function getAgentTheme(agentName: string) {
  if (agentName.includes("Career")) {
    return {
      icon: "💼",
      border: "border-blue-500/30",
      bg: "bg-blue-500/5",
      badge: "bg-blue-500/10",
      text: "text-blue-300",
    };
  }

  if (agentName.includes("Finance")) {
    return {
      icon: "💰",
      border: "border-green-500/30",
      bg: "bg-green-500/5",
      badge: "bg-green-500/10",
      text: "text-green-300",
    };
  }

  if (agentName.includes("Health")) {
    return {
      icon: "❤️",
      border: "border-pink-500/30",
      bg: "bg-pink-500/5",
      badge: "bg-pink-500/10",
      text: "text-pink-300",
    };
  }

  if (agentName.includes("Learning")) {
    return {
      icon: "📚",
      border: "border-violet-500/30",
      bg: "bg-violet-500/5",
      badge: "bg-violet-500/10",
      text: "text-violet-300",
    };
  }

  return {
    icon: "🧠",
    border: "border-slate-700",
    bg: "bg-slate-900",
    badge: "bg-slate-800",
    text: "text-cyan-300",
  };
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <p className={`text-sm font-medium ${color}`}>{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function PillList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-sm text-slate-400">Not enough data yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span
          key={index}
          className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800/80 p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-800/80 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-cyan-300">+{value}</p>
    </div>
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.requestId
      ? `${error.message} Reference: ${error.requestId}`
      : error.message;
  }
  return error instanceof Error
    ? error.message
    : "Agent profiles could not be loaded.";
}
