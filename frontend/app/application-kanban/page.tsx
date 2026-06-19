"use client";

import { useEffect, useState } from "react";

type Application = {
  id: number;
  company: string;
  role: string;
  location: string;
  status: string;
  date_applied: string;
  notes: string;
};

const statuses = ["Saved", "Applied", "Interview", "Offer", "Rejected"];

export default function ApplicationKanbanPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchApplications = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/applications/`
      );
      const data = await res.json();
      setApplications(data);
    } catch (error) {
      alert("Could not load applications.");
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    setLoading(true);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      fetchApplications();
    } catch (error) {
      alert("Could not update application status.");
    } finally {
      setLoading(false);
    }
  };

  const getApplicationsByStatus = (status: string) => {
    return applications.filter((app) => app.status === status);
  };

  const getColumnColor = (status: string) => {
    if (status === "Saved") return "border-slate-700";
    if (status === "Applied") return "border-blue-500/40";
    if (status === "Interview") return "border-yellow-500/40";
    if (status === "Offer") return "border-green-500/40";
    if (status === "Rejected") return "border-red-500/40";
    return "border-slate-700";
  };

  const getBadgeColor = (status: string) => {
    if (status === "Saved") return "bg-slate-700 text-slate-300";
    if (status === "Applied") return "bg-blue-500/20 text-blue-300";
    if (status === "Interview") return "bg-yellow-500/20 text-yellow-300";
    if (status === "Offer") return "bg-green-500/20 text-green-300";
    if (status === "Rejected") return "bg-red-500/20 text-red-300";
    return "bg-slate-700 text-slate-300";
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold">Application Kanban Board</h1>

      <p className="mt-2 text-slate-400">
        Track your job applications through each stage of the hiring pipeline.
      </p>

      {loading && (
        <p className="mt-4 text-indigo-400">
          Updating status...
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-5 gap-5">
        {statuses.map((status) => {
          const columnApps = getApplicationsByStatus(status);

          return (
            <div
              key={status}
              className={`bg-slate-900 border ${getColumnColor(
                status
              )} rounded-xl p-4 min-h-[500px]`}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-lg">{status}</h2>

                <span className={`text-xs px-2 py-1 rounded-full ${getBadgeColor(status)}`}>
                  {columnApps.length}
                </span>
              </div>

              <div className="space-y-4">
                {columnApps.length === 0 ? (
                  <p className="text-slate-500 text-sm">
                    No applications
                  </p>
                ) : (
                  columnApps.map((app) => (
                    <div
                      key={app.id}
                      className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                    >
                      <h3 className="font-semibold">{app.role}</h3>

                      <p className="text-slate-400 text-sm mt-1">
                        {app.company}
                      </p>

                      <p className="text-slate-500 text-xs mt-1">
                        {app.location || "-"}
                      </p>

                      {app.date_applied && (
                        <p className="text-slate-500 text-xs mt-2">
                          Applied: {app.date_applied}
                        </p>
                      )}

                      {app.notes && (
                        <details className="mt-3">
                          <summary className="text-xs text-indigo-400 cursor-pointer">
                            View Notes
                          </summary>

                          <p className="mt-2 text-xs text-slate-300 whitespace-pre-wrap max-h-40 overflow-auto">
                            {app.notes}
                          </p>
                        </details>
                      )}

                      <div className="mt-4">
                        <label className="text-xs text-slate-400">
                          Move to
                        </label>

                        <select
                          value={app.status}
                          onChange={(e) =>
                            updateStatus(app.id, e.target.value)
                          }
                          className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm outline-none"
                        >
                          {statuses.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}