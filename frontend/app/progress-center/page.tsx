"use client";

import { apiFetch } from "@/lib/api";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type ProgressSnapshot = {
  date: string;
  career_score: number;
  finance_score: number;
  health_score: number;
  learning_score: number;
  overall_score: number;
};

type InsightItem = {
  name: string;
  score?: number;
  change?: number;
};

type ProgressResponse = {
  history: ProgressSnapshot[];
  total_snapshots: number;
  latest: ProgressSnapshot | null;
  ai_review: string;
executive_recommendations: string[];
next_best_action: string;
risk_level: string;
  growth_forecast: {
  status: string;
  message: string;
  forecast: {
    career_score: number | null;
    finance_score: number | null;
    health_score: number | null;
    learning_score: number | null;
    overall_score: number | null;
  };
  recommendation: string;
};
achievements: {
  title: string;
  icon: string;
}[];
  insights: {
    best_twin: InsightItem | null;
    worst_twin: InsightItem | null;
    most_improved: InsightItem | null;
    overall_change: number;
    executive_review: string;
  };
  monthly_scorecard: {
    available: boolean;
    message?: string;
    period?: string;
    starting_overall?: number;
    current_overall?: number;
    overall_change?: number;
    career_change?: number;
    finance_change?: number;
    health_change?: number;
    learning_change?: number;
    latest_scores?: ProgressSnapshot;
  };
  weekly_report:
    | string
    | {
        career_change: number;
        finance_change: number;
        health_change: number;
        learning_change: number;
        overall_change: number;
      };
};

export default function ProgressCenterPage() {
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const downloadScorecard = () => {
  window.open("http://localhost:8000/api/progress/scorecard-pdf", "_blank");
};



  const loadProgress = async () => {
    setLoading(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await apiFetch(`${apiUrl}/api/progress/`);

      if (!res.ok) {
        throw new Error(`Progress API failed: ${res.status}`);
      }

      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Progress Center error:", error);
      alert("Could not load Progress Center.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const history = data?.history || [];
  const latest = data?.latest;
  const insights = data?.insights;
  const forecast = data?.["growth_forecast"];
  const achievements = data?.["achievements"];

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-cyan-300">My Digital Twin</p>
            <h1 className="mt-2 text-4xl font-bold">
              Progress Intelligence Center
            </h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Track your growth, trends, weekly progress, and executive-level
              insights across all Digital Twins.
            </p>
          </div>
          
          <button
          onClick={downloadScorecard}
          className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90"
        >
          Download Monthly Scorecard
        </button>

          <button
            onClick={loadProgress}
            disabled={loading}
            className="rounded-lg bg-cyan-600 px-5 py-3 font-medium hover:bg-cyan-500 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Progress"}
          </button>
        </div>
        

        {loading && (
          <div className="mt-10 rounded-2xl bg-slate-900 p-8 text-slate-300">
            Loading your progress intelligence...
          </div>
        )}

        {!loading && !latest && (
          <div className="mt-10 rounded-2xl bg-slate-900 p-8 text-slate-300">
            No snapshots found yet. Open Personal HQ once to create your first
            snapshot.
          </div>
        )}

        {!loading && latest && (
          <div className="mt-8 space-y-8">
            <section className="grid grid-cols-1 gap-5 md:grid-cols-5">
              <MetricCard label="Career" value={latest.career_score} />
              <MetricCard label="Finance" value={latest.finance_score} />
              <MetricCard label="Health" value={latest.health_score} />
              <MetricCard label="Learning" value={latest.learning_score} />
              <MetricCard label="Overall" value={latest.overall_score} />
            </section>

            <section className="rounded-2xl bg-slate-900 p-6">
              <p className="text-sm text-cyan-300">Twin Setup Alerts</p>
              <h2 className="mt-2 text-2xl font-bold">
                Areas That Need Setup
              </h2>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                {latest.career_score < 40 && (
                  <SetupAlert
                    title="Career Twin Needs Setup"
                    description="Add career goals, target roles, skills, and applications."
                  />
                )}

                {latest.finance_score < 40 && (
                  <SetupAlert
                    title="Finance Twin Needs Setup"
                    description="Add income, expenses, savings goals, and budget details."
                  />
                )}

                {latest.health_score < 40 && (
                  <SetupAlert
                    title="Health Twin Needs Setup"
                    description="Add health goals, habits, sleep, water, and workout details."
                  />
                )}

                {latest.learning_score < 40 && (
                  <SetupAlert
                    title="Learning Twin Needs Setup"
                    description="Add learning goals and complete roadmap tasks."
                  />
                )}

                {latest.career_score >= 40 &&
                  latest.finance_score >= 40 &&
                  latest.health_score >= 40 &&
                  latest.learning_score >= 40 && (
                    <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-5 md:col-span-4">
                      <p className="text-sm font-semibold text-green-300">
                        All Twins Active
                      </p>
                      <h3 className="mt-2 font-bold text-white">
                        Your Digital Twin foundation looks healthy.
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Continue adding daily data to improve long-term
                        recommendations.
                      </p>
                    </div>
                  )}
              </div>
            </section>

            {insights && (
              <section className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <InsightCard
                  title="Best Performing Twin"
                  value={insights.best_twin?.name || "N/A"}
                  description={`${insights.best_twin?.score || 0}% current score`}
                />

                <InsightCard
                  title="Most Improved Twin"
                  value={insights.most_improved?.name || "N/A"}
                  description={`${
                    (insights.most_improved?.change || 0) >= 0 ? "+" : ""
                  }${insights.most_improved?.change || 0}% since first snapshot`}
                />

                <InsightCard
                  title="Needs Attention"
                  value={insights.worst_twin?.name || "N/A"}
                  description={`${insights.worst_twin?.score || 0}% current score`}
                />

                <InsightCard
                  title="Overall Growth"
                  value={`${insights.overall_change >= 0 ? "+" : ""}${
                    insights.overall_change
                  }%`}
                  description="Since first snapshot"
                />
              </section>
            )}

            <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
  <p className="text-sm text-emerald-300">
    Multi-Agent Strategy
  </p>

  <h2 className="mt-2 text-2xl font-bold">
    Strategic Recommendations
  </h2>

  {data?.executive_recommendations?.length ? (
    <ul className="mt-5 space-y-3">
      {data.executive_recommendations.map((item, index) => (
        <li
          key={index}
          className="rounded-xl bg-slate-900 p-4 text-slate-300"
        >
          {item}
        </li>
      ))}
    </ul>
  ) : (
    <p className="mt-4 text-slate-400">
      No strategic recommendations available yet.
    </p>
  )}

  {data?.next_best_action && (
    <div className="mt-5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
      <p className="text-sm text-cyan-300">Next Best Action</p>
      <p className="mt-2 font-semibold text-white">
        {data.next_best_action}
      </p>
    </div>
  )}

  {data?.risk_level && (
    <div className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
      <p className="text-sm text-yellow-300">Risk Level</p>
      <p className="mt-2 font-semibold text-white">
        {data.risk_level}
      </p>
    </div>
  )}
</section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <TrendChart
                title="Career Trend"
                dataKey="career_score"
                data={history}
              />
              <TrendChart
                title="Finance Trend"
                dataKey="finance_score"
                data={history}
              />
              <TrendChart
                title="Health Trend"
                dataKey="health_score"
                data={history}
              />
              <TrendChart
                title="Learning Trend"
                dataKey="learning_score"
                data={history}
              />
            </section>

            <section>
              <TrendChart
                title="Overall Twin Trend"
                dataKey="overall_score"
                data={history}
                large
              />
            </section>

            <section className="rounded-2xl bg-slate-900 p-6">
              <p className="text-sm text-cyan-300">Weekly Growth Report</p>
              <h2 className="mt-2 text-2xl font-bold">
                Recent Performance Change
              </h2>

              {typeof data?.weekly_report === "string" ? (
                <p className="mt-4 text-slate-400">{data.weekly_report}</p>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-5">
                  <ChangeCard
                    label="Career"
                    value={data?.weekly_report.career_change || 0}
                  />
                  <ChangeCard
                    label="Finance"
                    value={data?.weekly_report.finance_change || 0}
                  />
                  <ChangeCard
                    label="Health"
                    value={data?.weekly_report.health_change || 0}
                  />
                  <ChangeCard
                    label="Learning"
                    value={data?.weekly_report.learning_change || 0}
                  />
                  <ChangeCard
                    label="Overall"
                    value={data?.weekly_report.overall_change || 0}
                  />
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-slate-900 p-6">
              <p className="text-sm text-cyan-300">Monthly Scorecard</p>
              <h2 className="mt-2 text-2xl font-bold">
                Digital Twin Growth Summary
              </h2>

              {!data?.monthly_scorecard?.available ? (
                <p className="mt-4 text-slate-400">
                  {data?.monthly_scorecard?.message}
                </p>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-5">
                  <ChangeCard
                    label="Career"
                    value={data.monthly_scorecard.career_change || 0}
                  />
                  <ChangeCard
                    label="Finance"
                    value={data.monthly_scorecard.finance_change || 0}
                  />
                  <ChangeCard
                    label="Health"
                    value={data.monthly_scorecard.health_change || 0}
                  />
                  <ChangeCard
                    label="Learning"
                    value={data.monthly_scorecard.learning_change || 0}
                  />
                  <ChangeCard
                    label="Overall"
                    value={data.monthly_scorecard.overall_change || 0}
                  />
                </div>
              )}
            </section>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6">
  <h2 className="text-xl font-bold mb-4">
    🔮 AI Growth Forecast
  </h2>

  {forecast?.status === "not_enough_data" ? (
    <div className="text-slate-400">
      {forecast?.message}
    </div>
  ) : (
    <>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Career</p>
          <h3 className="text-2xl font-bold">
            {forecast?.forecast?.career_score}%
          </h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Finance</p>
          <h3 className="text-2xl font-bold">
            {forecast?.forecast?.finance_score}%
          </h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Health</p>
          <h3 className="text-2xl font-bold">
            {forecast?.forecast?.health_score}%
          </h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Learning</p>
          <h3 className="text-2xl font-bold">
            {forecast?.forecast?.learning_score}%
          </h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Overall</p>
          <h3 className="text-2xl font-bold text-cyan-400">
            {forecast?.forecast?.overall_score}%
          </h3>
        </div>

      </div>

      <div className="mt-4 p-4 rounded-xl bg-slate-800">
        <p className="text-sm text-slate-300">
          {forecast?.recommendation}
        </p>
      </div>
    </>
  )}
</div>

<div className="bg-slate-900 rounded-2xl p-6 mt-6">
  <h2 className="text-xl font-bold mb-4">
    🏆 Achievements & Milestones
  </h2>

  <div className="flex flex-wrap gap-4">
    {data?.achievements?.map((badge, index) => (
      <div
        key={index}
        className="bg-slate-800 px-5 py-3 rounded-xl"
      >
        <span className="mr-2">{badge.icon}</span>
        {badge.title}
      </div>
    ))}
  </div>
</div>

            <section className="rounded-2xl bg-slate-900 p-6">
              <p className="text-sm text-cyan-300">Score History</p>
              <h2 className="mt-2 text-2xl font-bold">Snapshot Timeline</h2>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="border-b border-slate-700 text-slate-400">
                    <tr>
                      <th className="py-3">Date</th>
                      <th>Career</th>
                      <th>Finance</th>
                      <th>Health</th>
                      <th>Learning</th>
                      <th>Overall</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-800 text-slate-300"
                      >
                        <td className="py-3">{item.date}</td>
                        <td>{item.career_score}%</td>
                        <td>{item.finance_score}%</td>
                        <td>{item.health_score}%</td>
                        <td>{item.learning_score}%</td>
                        <td className="font-semibold text-cyan-300">
                          {item.overall_score}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
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

function InsightCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-cyan-300">{title}</p>
      <h3 className="mt-3 text-3xl font-bold">{value}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function ChangeCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-800 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h3
        className={`mt-2 text-2xl font-bold ${
          value >= 0 ? "text-green-400" : "text-red-400"
        }`}
      >
        {value >= 0 ? "+" : ""}
        {value}%
      </h3>
    </div>
  );
}

function SetupAlert({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5">
      <p className="text-sm font-semibold text-yellow-300">Needs Setup</p>
      <h3 className="mt-2 font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}

function TrendChart({
  title,
  dataKey,
  data,
  large = false,
}: {
  title: string;
  dataKey: keyof ProgressSnapshot;
  data: ProgressSnapshot[];
  large?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-slate-900 p-6">
      <p className="text-sm text-cyan-300">Twin Growth</p>
      <h2 className="mt-2 text-xl font-bold">{title}</h2>

      {data.length < 2 ? (
        <p className="mt-4 text-slate-400">
          More snapshots are needed to show this trend.
        </p>
      ) : (
        <div className={large ? "mt-6 h-[420px]" : "mt-6 h-[280px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}