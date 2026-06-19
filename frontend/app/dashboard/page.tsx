"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Application = {
  id: number;
  company: string;
  role: string;
  location: string;
  status: string;
  date_applied: string;
  notes: string;
};

type CareerMemory = {
  id?: number;
  career_goal: string;
  target_role: string;
  current_skills: string;
  skills_to_learn: string;
  notes: string;
};

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [memory, setMemory] = useState<CareerMemory | null>(null);

  const fetchApplications = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/`);
    const data = await res.json();
    setApplications(data);
  };

  const fetchMemory = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/memory/`);
    const data = await res.json();
    setMemory(data);
  };

  useEffect(() => {
    fetchApplications();
    fetchMemory();
  }, []);

  const total = applications.length;
  const saved = applications.filter((app) => app.status === "Saved").length;
  const applied = applications.filter((app) => app.status === "Applied").length;
  const interviews = applications.filter((app) => app.status === "Interview").length;
  const offers = applications.filter((app) => app.status === "Offer").length;
  const rejected = applications.filter((app) => app.status === "Rejected").length;

  const recentApplications = applications.slice(0, 5);

  let careerProgressScore = 0;

if (memory?.career_goal) careerProgressScore += 20;
if (memory?.target_role) careerProgressScore += 15;
if (memory?.current_skills) careerProgressScore += 15;
if (memory?.skills_to_learn) careerProgressScore += 10;

careerProgressScore += Math.min(applications.length * 3, 20);
careerProgressScore += Math.min(interviews * 5, 10);
careerProgressScore += Math.min(offers * 10, 10);

careerProgressScore = Math.min(careerProgressScore, 100);

  const cards = [
    { label: "Total Applications", value: total },
    { label: "Saved Jobs", value: saved },
    { label: "Applied", value: applied },
    { label: "Interviews", value: interviews },
    { label: "Offers", value: offers },
    { label: "Rejected", value: rejected },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Career Twin Dashboard</h1>
          <p className="mt-2 text-slate-400">
            Your AI-powered career command center.
          </p>
        </div>

        <Link
          href="/applications"
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500"
        >
          Add Application
        </Link>
      </div>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Career Memory</h2>
            <p className="text-slate-400 mt-1">
              What your Digital Twin currently remembers about your goals.
            </p>
          </div>

          <Link
            href="/memory"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Edit Memory
          </Link>
        </div>

        {memory ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-slate-400 text-sm">Career Goal</p>
              <p className="font-medium mt-2 whitespace-pre-wrap">
                {memory.career_goal || "-"}
              </p>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-slate-400 text-sm">Target Role</p>
              <p className="font-medium mt-2">
                {memory.target_role || "-"}
              </p>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-slate-400 text-sm">Current Skills</p>
              <p className="font-medium mt-2 whitespace-pre-wrap">
                {memory.current_skills || "-"}
              </p>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-slate-400 text-sm">Skills to Learn</p>
              <p className="font-medium mt-2 whitespace-pre-wrap">
                {memory.skills_to_learn || "-"}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-lg bg-slate-800 p-4">
            <p className="text-slate-300">
              No Career Memory saved yet.
            </p>

            <Link
              href="/memory"
              className="inline-block mt-3 text-indigo-400 hover:text-indigo-300"
            >
              Create Career Memory
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
  <h2 className="text-xl font-semibold">Career Progress Score</h2>

  <p className="text-slate-400 mt-1">
    Your progress based on saved career memory and application activity.
  </p>

  <div className="mt-5">
    <p className="text-5xl font-bold text-indigo-400">
      {careerProgressScore}%
    </p>

    <div className="mt-4 h-3 w-full rounded-full bg-slate-800">
      <div
        className="h-3 rounded-full bg-indigo-500"
        style={{ width: `${careerProgressScore}%` }}
      />
    </div>

    <p className="mt-4 text-sm text-slate-400">
      Complete your memory, add applications, and track interviews to increase your score.
    </p>
  </div>
</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-slate-900 p-6 rounded-xl">
            <p className="text-slate-400">{card.label}</p>
            <h2 className="text-3xl font-bold mt-2">{card.value}</h2>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <h2 className="text-xl font-semibold">Recent Applications</h2>

        {recentApplications.length === 0 ? (
          <p className="text-slate-400 mt-4">
            No applications yet. Add your first application.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="text-left py-3">Company</th>
                  <th className="text-left py-3">Role</th>
                  <th className="text-left py-3">Location</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {recentApplications.map((app) => (
                  <tr key={app.id} className="border-b border-slate-800">
                    <td className="py-3">{app.company}</td>
                    <td className="py-3">{app.role}</td>
                    <td className="py-3">{app.location || "-"}</td>
                    <td className="py-3">{app.status}</td>
                    <td className="py-3">{app.date_applied || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}