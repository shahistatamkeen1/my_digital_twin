import Link from "next/link";
import SpatialCard from "./SpatialCard";

type AgentCardProps = {
  title: string;
  description: string;
  status: "available" | "coming-soon";
  href: string;
};

export default function AgentCard({
  title,
  description,
  status,
  href,
}: AgentCardProps) {
  const card = (
    <SpatialCard className="h-full transition hover:-translate-y-1 hover:border-cyan-400/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {description}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs ${
            status === "available"
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-slate-700 text-slate-300"
          }`}
        >
          {status === "available" ? "Available" : "Coming Soon"}
        </span>
      </div>
    </SpatialCard>
  );

  if (status === "available") {
    return <Link href={href}>{card}</Link>;
  }

  return <div className="cursor-not-allowed opacity-70">{card}</div>;
}