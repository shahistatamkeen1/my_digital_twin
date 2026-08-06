import { AGENT_VISUALS } from "@/components/orchestration/agent-visuals";
import type {
  AgentContribution,
  AgentName,
  AgentRunDetail,
  UnifiedAgentPlan,
} from "@/types/agent-runs";

export default function AgentRunResult({ run }: { run: AgentRunDetail }) {
  const result = run.result_payload;
  if (!result) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-14 text-center">
        <div className="text-4xl">🧠</div>
        <h2 className="mt-4 text-xl font-bold">Your unified plan will appear here</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
          Review the routed twins, then execute this workflow to generate
          cross-domain recommendations and synthesis.
        </p>
      </section>
    );
  }

  const plan = result.unified_plan;
  const directContributions = result.agent_contributions;

  if (!plan && !directContributions) {
    return (
      <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6">
        <h2 className="text-xl font-bold text-amber-100">Result recorded</h2>
        <p className="mt-2 text-sm text-amber-200/80">
          This workflow returned a result payload without a recognised synthesis
          structure. Review the execution error and individual steps.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {plan ? <UnifiedPlan plan={plan} /> : null}
      <ContributionGrid
        contributions={plan?.agent_contributions || directContributions || {}}
      />
    </div>
  );
}

function UnifiedPlan({ plan }: { plan: UnifiedAgentPlan }) {
  return (
    <section className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-slate-900/90 to-cyan-500/10 p-5 sm:p-7">
      <p className="text-sm font-semibold text-violet-300">Unified synthesis</p>
      <h2 className="mt-2 text-2xl font-bold">Coordinated action plan</h2>
      <p className="mt-4 text-sm leading-7 text-slate-200">{plan.summary}</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ListPanel
          title="🎯 Priorities"
          items={plan.priorities}
          emptyLabel="No priorities returned."
          tone="cyan"
        />
        <ListPanel
          title="⚠️ Risks"
          items={plan.risks}
          emptyLabel="No cross-domain risks returned."
          tone="amber"
        />
        <ListPanel
          title="📈 Success metrics"
          items={plan.success_metrics}
          emptyLabel="No success metrics returned."
          tone="emerald"
        />
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5">
          <p className="text-sm font-semibold text-violet-200">
            🗓️ Next checkpoint
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            {plan.next_checkpoint || "No checkpoint returned."}
          </p>
        </div>
      </div>

      {plan.weekly_plan.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-white">Weekly plan</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {plan.weekly_plan.map((item, index) => (
              <article
                key={`${index}-${JSON.stringify(item)}`}
                className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                  Step {index + 1}
                </p>
                <dl className="mt-3 space-y-2">
                  {Object.entries(item).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs font-medium capitalize text-slate-500">
                        {key.replaceAll("_", " ")}
                      </dt>
                      <dd className="mt-0.5 text-sm leading-5 text-slate-200">
                        {formatUnknown(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ContributionGrid({
  contributions,
}: {
  contributions: Partial<Record<AgentName, AgentContribution>>;
}) {
  const entries = Object.entries(contributions) as Array<
    [AgentName, AgentContribution]
  >;

  if (entries.length === 0) {
    return null;
  }

  return (
    <section>
      <div>
        <p className="text-sm font-semibold text-cyan-300">
          Twin contributions
        </p>
        <h2 className="mt-1 text-2xl font-bold">Domain-level recommendations</h2>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {entries.map(([name, contribution]) => {
          const visual = AGENT_VISUALS[name];

          return (
            <article
              key={name}
              className={`rounded-3xl border p-5 ${visual.cardClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    {visual.icon}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {visual.label}
                    </h3>
                    <p className="text-xs text-slate-400">Execution contribution</p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold text-white">
                    Score {contribution.score}/100
                  </p>
                  <p className="mt-1 text-slate-400">
                    {contribution.confidence}% confidence
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-200">
                {contribution.summary}
              </p>

              <ContributionList
                title="Recommendations"
                items={contribution.recommendations}
              />
              <ContributionList
                title="Key data points"
                items={contribution.key_data_points}
              />
              {contribution.risks.length > 0 && (
                <ContributionList title="Risks" items={contribution.risks} />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ListPanel({
  title,
  items,
  emptyLabel,
  tone,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
  tone: "cyan" | "amber" | "emerald";
}) {
  const styles = {
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[tone]}`}>
      <p className="text-sm font-semibold">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
          {items.map((item, index) => (
            <li key={`${index}-${item}`} className="flex gap-2">
              <span className="text-slate-500">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-400">{emptyLabel}</p>
      )}
    </div>
  );
}

function ContributionList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <ul className="mt-2 space-y-1.5 text-sm leading-5 text-slate-300">
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="flex gap-2">
            <span className="text-slate-600">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatUnknown(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(formatUnknown).join(", ");
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
