import type { ChangeEvent } from "react";

import AgentRegistryGrid from "@/components/orchestration/AgentRegistryGrid";
import type {
  AgentDefinition,
  AgentExecutionProvider,
  AgentName,
} from "@/types/agent-runs";

export type GoalComposerValues = {
  goal: string;
  preferredAgents: AgentName[];
  includeWeeklyPlan: boolean;
};

type Props = {
  agents: AgentDefinition[];
  values: GoalComposerValues;
  provider: AgentExecutionProvider;
  allowPartial: boolean;
  allowFallback: boolean;
  forceSequential: boolean;
  selectedAgents?: AgentName[];
  busy: boolean;
  onChange: (values: GoalComposerValues) => void;
  onProviderChange: (provider: AgentExecutionProvider) => void;
  onAllowPartialChange: (value: boolean) => void;
  onAllowFallbackChange: (value: boolean) => void;
  onForceSequentialChange: (value: boolean) => void;
  onSubmit: () => void;
};

const QUICK_GOALS = [
  "Prepare for an AI Engineer role while building a six-month savings plan.",
  "Create a sustainable weekly plan for job search, learning, and health.",
  "Help me plan a relocation without losing career or wellness momentum.",
  "Identify my biggest cross-domain blocker and create a 30-day action plan.",
];

export default function AgentGoalComposer({
  agents,
  values,
  provider,
  allowPartial,
  allowFallback,
  forceSequential,
  selectedAgents,
  busy,
  onChange,
  onProviderChange,
  onAllowPartialChange,
  onAllowFallbackChange,
  onForceSequentialChange,
  onSubmit,
}: Props) {
  const togglePreferred = (name: AgentName) => {
    const exists = values.preferredAgents.includes(name);
    onChange({
      ...values,
      preferredAgents: exists
        ? values.preferredAgents.filter((item) => item !== name)
        : [...values.preferredAgents, name],
    });
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-300">
            New coordinated mission
          </p>
          <h2 className="mt-1 text-2xl font-bold">Plan with your Twin Network</h2>
        </div>
        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200">
          Routing is automatic
        </span>
      </div>

      <label className="mt-5 block text-sm font-medium text-slate-200">
        What outcome do you want to achieve?
      </label>
      <textarea
        value={values.goal}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          onChange({
            ...values,
            goal: event.target.value,
          })
        }
        disabled={busy}
        rows={5}
        maxLength={5000}
        placeholder="Example: Prepare for an AI Engineer role while saving enough to relocate within six months."
        className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-slate-700 bg-slate-950/80 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 disabled:opacity-60"
      />
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>Be specific about the outcome and timeline.</span>
        <span>{values.goal.length}/5000</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_GOALS.map((goal) => (
          <button
            type="button"
            key={goal}
            disabled={busy}
            onClick={() => onChange({ ...values, goal })}
            className="rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-cyan-500 hover:text-white disabled:opacity-60"
          >
            {goal}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Twin preferences</p>
            <p className="text-xs text-slate-400">
              Optional: mark twins that must be included. The router can add others.
            </p>
          </div>
          <button
            type="button"
            disabled={busy || values.preferredAgents.length === 0}
            onClick={() => onChange({ ...values, preferredAgents: [] })}
            className="self-start text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-40"
          >
            Clear preferences
          </button>
        </div>

        <AgentRegistryGrid
          agents={agents}
          preferredAgents={values.preferredAgents}
          selectedAgents={selectedAgents}
          disabled={busy}
          onTogglePreferred={togglePreferred}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <label className="text-sm font-semibold text-white" htmlFor="provider">
            Execution provider
          </label>
          <select
            id="provider"
            value={provider}
            disabled={busy}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              onProviderChange(event.target.value as AgentExecutionProvider)
            }
            className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
          >
            <option value="deterministic">Local deterministic · no AI tokens</option>
            <option value="configured">Configured AI provider</option>
          </select>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Provider selection is used when you execute the planned workflow.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <OptionToggle
            label="Include weekly plan"
            description="Ask synthesis to return a structured weekly schedule."
            checked={values.includeWeeklyPlan}
            disabled={busy}
            onChange={(checked) =>
              onChange({ ...values, includeWeeklyPlan: checked })
            }
          />
          <OptionToggle
            label="Allow partial completion"
            description="Keep useful results when one twin fails."
            checked={allowPartial}
            disabled={busy}
            onChange={onAllowPartialChange}
          />
          <OptionToggle
            label="Allow deterministic fallback"
            description="Use local synthesis after a configured-AI failure."
            checked={allowFallback}
            disabled={busy || provider === "deterministic"}
            onChange={onAllowFallbackChange}
          />
          <OptionToggle
            label="Force sequential execution"
            description="Run one twin at a time instead of in parallel."
            checked={forceSequential}
            disabled={busy}
            onChange={onForceSequentialChange}
          />
        </div>
      </div>

      <button
        type="button"
        disabled={busy || values.goal.trim().length < 5}
        onClick={onSubmit}
        className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-900/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Creating workflow plan..." : "Create workflow plan"}
      </button>
    </section>
  );
}

function OptionToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-slate-200">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.checked)
        }
        className="mt-1 h-4 w-4 accent-cyan-500"
      />
    </label>
  );
}
