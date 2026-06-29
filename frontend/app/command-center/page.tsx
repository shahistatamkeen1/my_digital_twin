"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type FocusScores = {
  career_score: number;
  finance_score: number;
  health_score: number;
  overall_score: number;
  highest_roi_focus: string;
};

type NotificationItem = {
  category: string;
  priority: string;
  priority_score: number;
  title: string;
  message: string;
  recommended_action: string;
  action_label: string;
  action_type: string;
  action_url: string;
};

type NotificationResponse = {
  summary: string;
  notifications: NotificationItem[];
  focus_scores: FocusScores;
};

export default function CommandCenterPage() {
  const router = useRouter();

  const [data, setData] = useState<NotificationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCommandCenter = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/twin-notifications/`
      );

      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Command Center error:", error);
      alert("Could not load Command Center.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommandCenter();
  }, []);

  const priorityClass = (priority: string) => {
    if (priority === "Critical") {
      return "border-red-600 bg-red-600/20 text-red-200";
    }

    if (priority === "High") {
      return "border-orange-500 bg-orange-500/10 text-orange-300";
    }

    if (priority === "Medium") {
      return "border-yellow-500 bg-yellow-500/10 text-yellow-300";
    }

    return "border-green-500 bg-green-500/10 text-green-300";
  };

  const openAction = (item: NotificationItem) => {
    if (item.action_type === "navigate" && item.action_url) {
      router.push(item.action_url);
    }
  };

  const topNotifications = data?.notifications?.slice(0, 3) || [];

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-cyan-300">My Digital Twin</p>
            <h1 className="mt-2 text-4xl font-bold">
              Command Center Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Your centralized personal operating system for career, finance,
              health, daily priorities, and AI-powered recommendations.
            </p>
          </div>

          <button
            onClick={loadCommandCenter}
            disabled={loading}
            className="rounded-lg bg-cyan-600 px-5 py-3 font-medium hover:bg-cyan-500 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Dashboard"}
          </button>
        </div>

        {loading && (
          <div className="mt-10 rounded-2xl bg-slate-900 p-8 text-slate-300">
            Loading your Digital Twin Command Center...
          </div>
        )}

        {!loading && data && (
          <div className="mt-8 space-y-8">
            <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
              <ScoreCard
                label="Career"
                value={data.focus_scores.career_score}
              />
              <ScoreCard
                label="Finance"
                value={data.focus_scores.finance_score}
              />
              <ScoreCard
                label="Health"
                value={data.focus_scores.health_score}
              />
              <ScoreCard
                label="Overall Twin"
                value={data.focus_scores.overall_score}
              />
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6 lg:col-span-2">
                <p className="text-sm text-cyan-300">
                  Executive Twin Summary
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Today&apos;s Intelligence Brief
                </h2>
                <p className="mt-4 leading-7 text-slate-300">
                  {data.summary}
                </p>
              </div>

              <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6">
                <p className="text-sm text-violet-300">
                  Highest ROI Focus
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  {data.focus_scores.highest_roi_focus}
                </h2>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  This is the area your Digital Twin believes can create the
                  highest improvement right now.
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <QuickAction
                title="Ask Twin Orchestrator"
                description="Ask one question across Career, Finance, and Health."
                button="Open Orchestrator"
                onClick={() => router.push("/twin-orchestrator")}
              />

              <QuickAction
                title="Daily Brief"
                description="Review your AI-generated daily plan and focus areas."
                button="Open Daily Brief"
                onClick={() => router.push("/twin-brief")}
              />

              <QuickAction
                title="Notification Center"
                description="View all prioritized alerts and recommended actions."
                button="Open Notifications"
                onClick={() => router.push("/twin-notifications")}
              />
            </section>

            <section className="rounded-2xl bg-slate-900 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-cyan-300">Top Priorities</p>
                  <h2 className="mt-1 text-2xl font-bold">
                    Highest Priority Alerts
                  </h2>
                </div>

                <button
                  onClick={() => router.push("/twin-notifications")}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  View All
                </button>
              </div>

              {topNotifications.length === 0 ? (
                <p className="mt-5 text-slate-400">
                  No priority alerts available right now.
                </p>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {topNotifications.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-700 bg-slate-800 p-5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-cyan-300">
                          {item.category}
                        </p>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs ${priorityClass(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-semibold">
                        {item.title}
                      </h3>

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
                        {item.message}
                      </p>

                      <p className="mt-4 text-xs text-slate-500">
                        Priority Score: {item.priority_score}
                      </p>

                      <button
                        onClick={() => openAction(item)}
                        className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium hover:bg-cyan-500"
                      >
                        {item.action_label || "Open"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-900 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-2 text-4xl font-bold text-cyan-400">{value}%</h3>

      <div className="mt-4 h-3 rounded-full bg-slate-700">
        <div
          className="h-3 rounded-full bg-cyan-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function QuickAction({
  title,
  description,
  button,
  onClick,
}: {
  title: string;
  description: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>

      <button
        onClick={onClick}
        className="mt-5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-slate-700"
      >
        {button}
      </button>
    </div>
  );
}