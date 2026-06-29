"use client";

import { useState } from "react";
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
  priority: "Critical" | "High" | "Medium" | "Low" | string;
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

export default function TwinNotificationsPage() {
  const router = useRouter();

  const [data, setData] = useState<NotificationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/twin-notifications/`
      );

      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Notification Center error:", error);
      alert("Could not generate notifications.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleAction = (item: NotificationItem) => {
    if (item.action_type === "navigate" && item.action_url) {
      router.push(item.action_url);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <p className="text-sm text-cyan-300">Master Digital Twin</p>

      <h1 className="mt-2 text-4xl font-bold">Notification Center</h1>

      <p className="mt-3 max-w-3xl text-slate-400">
        Generate proactive alerts across Career, Finance, Health, Personal
        Memory, and your Twin Orchestrator.
      </p>

      <button
        onClick={loadNotifications}
        disabled={loading}
        className="mt-8 rounded-lg bg-cyan-600 px-5 py-3 font-medium hover:bg-cyan-500 disabled:opacity-50"
      >
        {loading ? "Scanning..." : "Generate Notifications"}
      </button>

      {data && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
            <h2 className="text-2xl font-bold">Notification Summary</h2>
            <p className="mt-3 text-slate-300">{data.summary}</p>
          </div>

          {data.focus_scores && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <ScoreCard label="Career" value={data.focus_scores.career_score} />
              <ScoreCard label="Finance" value={data.focus_scores.finance_score} />
              <ScoreCard label="Health" value={data.focus_scores.health_score} />
              <ScoreCard label="Overall" value={data.focus_scores.overall_score} />
            </div>
          )}

          <div className="rounded-xl bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Alerts</h2>

            {data.notifications.length === 0 ? (
              <p className="mt-4 text-slate-400">No notifications generated.</p>
            ) : (
              <div className="mt-5 space-y-4">
                {data.notifications.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-700 bg-slate-800 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-cyan-300">{item.category}</p>
                        <h3 className="mt-1 text-lg font-semibold">
                          {item.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                          Score {item.priority_score}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs ${priorityClass(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </div>
                    </div>

                    <p className="mt-4 text-slate-300">{item.message}</p>

                    <div className="mt-4 rounded-lg bg-slate-900 p-4">
                      <p className="text-sm text-slate-400">
                        Recommended Action
                      </p>
                      <p className="mt-1 text-white">
                        {item.recommended_action}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAction(item)}
                      className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium hover:bg-cyan-500"
                    >
                      {item.action_label || "Open"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-2 text-3xl font-bold text-cyan-400">{value}%</h3>

      <div className="mt-3 h-3 rounded-full bg-slate-700">
        <div
          className="h-3 rounded-full bg-cyan-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}