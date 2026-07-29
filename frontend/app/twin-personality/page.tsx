"use client";

import { apiFetch } from "@/lib/api";

import { useCallback, useEffect, useState } from "react";

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

  const loadProfiles = useCallback(async () => {
    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agent-profiles/`
      );

      const data = await res.json();
      setProfiles(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm text-cyan-300">Digital Twin Intelligence</p>

        <h1 className="mt-2 text-4xl font-bold">
          Twin Personality Dashboard
        </h1>

        <p className="mt-3 max-w-3xl text-slate-400">
          View learned goals, preferences, risks, and confidence growth across
          your AI agents.
        </p>

        {loading ? (
          <div className="mt-8 rounded-2xl bg-slate-900 p-8">
            Loading personality profiles...
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {profiles.map((profile) => (
              <AgentProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </div>
    </main>
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