import { AGENT_VISUALS } from "@/components/orchestration/agent-visuals";
import type { AgentDefinition, AgentName } from "@/types/agent-runs";

type Props = {
  agents: AgentDefinition[];
  preferredAgents: AgentName[];
  selectedAgents?: AgentName[];
  disabled?: boolean;
  onTogglePreferred: (name: AgentName) => void;
};

export default function AgentRegistryGrid({
  agents,
  preferredAgents,
  selectedAgents = [],
  disabled = false,
  onTogglePreferred,
}: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {agents.map((agent) => {
        const visual = AGENT_VISUALS[agent.name];
        const preferred = preferredAgents.includes(agent.name);
        const routed = selectedAgents.includes(agent.name);

        return (
          <button
            type="button"
            key={agent.name}
            disabled={disabled}
            onClick={() => onTogglePreferred(agent.name)}
            aria-pressed={preferred}
            className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
              preferred ? visual.selectedClass : visual.cardClass
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  {visual.icon}
                </span>
                <div>
                  <p className="font-semibold text-white">{agent.display_name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {agent.timeout_seconds}s · {agent.max_retries} retries
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {preferred && (
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white">
                    Required
                  </span>
                )}
                {routed && (
                  <span className="rounded-full bg-cyan-400/15 px-2 py-1 text-[10px] font-semibold text-cyan-200">
                    Routed
                  </span>
                )}
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-300">
              {agent.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
