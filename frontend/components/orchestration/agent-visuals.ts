import type { AgentName } from "@/types/agent-runs";

export type AgentVisual = {
  icon: string;
  label: string;
  shortLabel: string;
  cardClass: string;
  selectedClass: string;
  badgeClass: string;
};

export const AGENT_VISUALS: Record<AgentName, AgentVisual> = {
  career: {
    icon: "💼",
    label: "Career Twin",
    shortLabel: "Career",
    cardClass: "border-indigo-500/30 bg-indigo-500/10",
    selectedClass: "border-indigo-400 bg-indigo-500/20 ring-1 ring-indigo-400/40",
    badgeClass: "bg-indigo-500/15 text-indigo-200",
  },
  finance: {
    icon: "💰",
    label: "Finance Twin",
    shortLabel: "Finance",
    cardClass: "border-emerald-500/30 bg-emerald-500/10",
    selectedClass: "border-emerald-400 bg-emerald-500/20 ring-1 ring-emerald-400/40",
    badgeClass: "bg-emerald-500/15 text-emerald-200",
  },
  health: {
    icon: "❤️",
    label: "Health Twin",
    shortLabel: "Health",
    cardClass: "border-rose-500/30 bg-rose-500/10",
    selectedClass: "border-rose-400 bg-rose-500/20 ring-1 ring-rose-400/40",
    badgeClass: "bg-rose-500/15 text-rose-200",
  },
  learning: {
    icon: "📚",
    label: "Learning Twin",
    shortLabel: "Learning",
    cardClass: "border-cyan-500/30 bg-cyan-500/10",
    selectedClass: "border-cyan-400 bg-cyan-500/20 ring-1 ring-cyan-400/40",
    badgeClass: "bg-cyan-500/15 text-cyan-200",
  },
};

export function formatAgentName(name: AgentName): string {
  return AGENT_VISUALS[name].label;
}
