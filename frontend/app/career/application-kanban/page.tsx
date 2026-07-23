"use client";

import { apiFetch } from "@/lib/api";

import { useCallback, useEffect, useState } from "react";

type Application = {
  id: number;
  company: string;
  role: string;
  location: string;
  status: string;
  date_applied: string;
  notes: string;
};

const STATUSES = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
] as const;

type ApplicationStatus = (typeof STATUSES)[number];

export default function ApplicationKanbanPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [updatingApplicationId, setUpdatingApplicationId] = useState<
    number | null
  >(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchApplications = useCallback(async () => {
    if (!apiUrl) {
      alert("NEXT_PUBLIC_API_URL is not configured.");
      setLoadingApplications(false);
      return;
    }

    try {
      setLoadingApplications(true);

      const response = await apiFetch(`${apiUrl}/api/applications/`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to load applications: ${response.status}`
        );
      }

      const data = await response.json();

      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Could not load applications:", error);
      alert("Could not load applications.");
    } finally {
      setLoadingApplications(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateStatus = async (
    id: number,
    status: ApplicationStatus
  ) => {
    if (!apiUrl) {
      alert("NEXT_PUBLIC_API_URL is not configured.");
      return;
    }

    const previousApplications = applications;

    setUpdatingApplicationId(id);

    setApplications((currentApplications) =>
      currentApplications.map((application) =>
        application.id === id
          ? {
              ...application,
              status,
            }
          : application
      )
    );

    try {
      const response = await apiFetch(
        `${apiUrl}/api/applications/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update application: ${response.status}`
        );
      }

      await fetchApplications();
    } catch (error) {
      console.error("Could not update application status:", error);

      setApplications(previousApplications);
      alert("Could not update application status.");
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const getApplicationsByStatus = (
    status: ApplicationStatus
  ) => {
    return applications.filter(
      (application) => application.status === status
    );
  };

  const getColumnColor = (
    status: ApplicationStatus
  ): string => {
    const colors: Record<ApplicationStatus, string> = {
      Saved: "border-slate-700",
      Applied: "border-blue-500/40",
      Interview: "border-yellow-500/40",
      Offer: "border-green-500/40",
      Rejected: "border-red-500/40",
    };

    return colors[status];
  };

  const getBadgeColor = (
    status: ApplicationStatus
  ): string => {
    const colors: Record<ApplicationStatus, string> = {
      Saved: "bg-slate-700 text-slate-300",
      Applied: "bg-blue-500/20 text-blue-300",
      Interview: "bg-yellow-500/20 text-yellow-300",
      Offer: "bg-green-500/20 text-green-300",
      Rejected: "bg-red-500/20 text-red-300",
    };

    return colors[status];
  };

  return (
    <>
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Application Kanban Board
        </h1>

        <p className="mt-2 max-w-3xl text-slate-400">
          Track your job applications through each stage of the
          hiring pipeline.
        </p>
      </header>

      {updatingApplicationId !== null && (
        <div
          className="mt-4 inline-flex rounded-lg bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300"
          role="status"
          aria-live="polite"
        >
          Updating application status...
        </div>
      )}

      <div className="mt-6 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-sm text-indigo-300 xl:hidden">
        ← Swipe horizontally to view all application stages →
      </div>

      {loadingApplications ? (
        <div
          className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-400"
          role="status"
          aria-live="polite"
        >
          Loading applications...
        </div>
      ) : (
        <div className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5">
          {STATUSES.map((status) => {
            const columnApplications =
              getApplicationsByStatus(status);

            return (
              <section
                key={status}
                className={`min-h-[500px] min-w-[300px] flex-shrink-0 snap-start rounded-xl border bg-slate-900 p-4 sm:min-w-[320px] ${getColumnColor(
                  status
                )}`}
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">
                    {status}
                  </h2>

                  <span
                    className={`rounded-full px-2 py-1 text-xs ${getBadgeColor(
                      status
                    )}`}
                  >
                    {columnApplications.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {columnApplications.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-700 p-5 text-center">
                      <p className="text-sm text-slate-500">
                        No applications
                      </p>
                    </div>
                  ) : (
                    columnApplications.map((application) => (
                      <article
                        key={application.id}
                        className="min-w-0 rounded-lg border border-slate-700 bg-slate-800 p-4 transition hover:border-indigo-500/40"
                      >
                        <h3 className="break-words font-semibold">
                          {application.role}
                        </h3>

                        <p className="mt-1 break-words text-sm text-slate-400">
                          {application.company}
                        </p>

                        <p className="mt-1 break-words text-xs text-slate-500">
                          {application.location ||
                            "Location not provided"}
                        </p>

                        {application.date_applied && (
                          <p className="mt-2 text-xs text-slate-500">
                            Applied: {application.date_applied}
                          </p>
                        )}

                        {application.notes && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-xs text-indigo-400">
                              View Notes
                            </summary>

                            <p className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">
                              {application.notes}
                            </p>
                          </details>
                        )}

                        <div className="mt-4">
                          <label
                            htmlFor={`application-status-${application.id}`}
                            className="text-xs text-slate-400"
                          >
                            Move to
                          </label>

                          <select
                            id={`application-status-${application.id}`}
                            value={application.status}
                            disabled={
                              updatingApplicationId ===
                              application.id
                            }
                            onChange={(event) =>
                              updateStatus(
                                application.id,
                                event.target
                                  .value as ApplicationStatus
                              )
                            }
                            className="mt-2 w-full rounded-lg bg-slate-900 p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {STATUSES.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}