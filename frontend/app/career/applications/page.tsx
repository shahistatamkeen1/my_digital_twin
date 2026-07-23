"use client";

import { apiFetch } from "@/lib/api";

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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    company: "",
    role: "",
    location: "",
    status: "Saved",
    date_applied: "",
    notes: "",
  });

  const fetchApplications = async () => {
    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/`);
      const data = await res.json();
      setApplications(data);
    } catch (error) {
      alert("Could not load applications.");
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const addApplication = async () => {
    if (!form.company || !form.role) {
      alert("Company and role are required.");
      return;
    }

    setLoading(true);

    try {
      await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      setForm({
        company: "",
        role: "",
        location: "",
        status: "Saved",
        date_applied: "",
        notes: "",
      });

      fetchApplications();
    } catch (error) {
      alert("Could not add application.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      fetchApplications();
    } catch (error) {
      alert("Could not update status.");
    }
  };

  const deleteApplication = async (id: number) => {
    try {
      await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/${id}`, {
        method: "DELETE",
      });

      fetchApplications();
    } catch (error) {
      alert("Could not delete application.");
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "Applied") return "bg-blue-500/20 text-blue-300";
    if (status === "Interview") return "bg-yellow-500/20 text-yellow-300";
    if (status === "Offer") return "bg-green-500/20 text-green-300";
    if (status === "Rejected") return "bg-red-500/20 text-red-300";
    return "bg-slate-700 text-slate-300";
  };

  return (
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">
  Application Tracker
</h1>

      <p className="mt-2 text-slate-400">
        Track saved, applied, interview, offer, and rejected jobs.
      </p>

      <div className="mt-8 rounded-xl bg-slate-900 p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Add New Application</h2>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <input
            name="company"
            value={form.company}
            onChange={handleChange}
            placeholder="Company"
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

          <input
            name="role"
            value={form.role}
            onChange={handleChange}
            placeholder="Role"
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Location"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <input
            name="date_applied"
            type="date"
            value={form.date_applied}
            onChange={handleChange}
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="bg-slate-800 p-3 rounded-lg outline-none"
          >
            <option value="Saved">Saved</option>
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
          </select>

          <textarea
  name="notes"
  value={form.notes}
  onChange={handleChange}
  placeholder="Notes"
  rows={4}
  className="min-h-[120px] w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40 lg:col-span-2"
/>
        </div>

        <button
          onClick={addApplication}
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50 sm:w-auto"
        >
          {loading ? "Adding..." : "Add Application"}
        </button>
      </div>

 <div className="mt-8 rounded-xl bg-slate-900 p-5 sm:p-6">
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-xl font-semibold">Tracked Applications</h2>
      <p className="mt-1 text-sm text-slate-400">
        {applications.length} application
        {applications.length === 1 ? "" : "s"} currently tracked.
      </p>
    </div>
  </div>

  {applications.length === 0 ? (
    <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
      No applications added yet.
    </div>
  ) : (
    <>
      {/* Mobile Cards */}
      <div className="mt-5 space-y-4 lg:hidden">
        {applications.map((app) => (
          <div
            key={app.id}
            className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-white">
                  {app.company}
                </h3>

                <p className="mt-1 text-sm text-slate-300">
                  {app.role}
                </p>
              </div>

              <button
                onClick={() => deleteApplication(app.id)}
                className="shrink-0 text-sm text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-800 p-3">
                <p className="text-xs text-slate-500">Location</p>
                <p className="mt-1 text-sm text-slate-300">
                  {app.location || "-"}
                </p>
              </div>

              <div className="rounded-lg bg-slate-800 p-3">
                <p className="text-xs text-slate-500">Date Applied</p>
                <p className="mt-1 text-sm text-slate-300">
                  {app.date_applied || "-"}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <p className="mb-2 text-xs text-slate-500">Status</p>

              <select
                value={app.status}
                onChange={(e) =>
                  updateStatus(app.id, e.target.value)
                }
                className={`w-full rounded-lg px-3 py-2 outline-none ${getStatusColor(
                  app.status
                )}`}
              >
                <option value="Saved">Saved</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {app.notes && (
              <div className="mt-3 rounded-lg bg-slate-800 p-3">
                <p className="text-xs text-slate-500">Notes</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                  {app.notes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="mt-5 hidden overflow-x-auto lg:block">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="border-b border-slate-700 text-slate-400">
            <tr>
              <th className="px-3 py-3 text-left">Company</th>
              <th className="px-3 py-3 text-left">Role</th>
              <th className="px-3 py-3 text-left">Location</th>
              <th className="px-3 py-3 text-left">Status</th>
              <th className="px-3 py-3 text-left">Date</th>
              <th className="px-3 py-3 text-left">Notes</th>
              <th className="px-3 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {applications.map((app) => (
              <tr
                key={app.id}
                className="border-b border-slate-800 align-top"
              >
                <td className="px-3 py-4 font-medium text-white">
                  {app.company}
                </td>

                <td className="px-3 py-4">{app.role}</td>

                <td className="px-3 py-4">
                  {app.location || "-"}
                </td>

                <td className="px-3 py-4">
                  <select
                    value={app.status}
                    onChange={(e) =>
                      updateStatus(app.id, e.target.value)
                    }
                    className={`rounded-lg px-2 py-1 outline-none ${getStatusColor(
                      app.status
                    )}`}
                  >
                    <option value="Saved">Saved</option>
                    <option value="Applied">Applied</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </td>

                <td className="px-3 py-4">
                  {app.date_applied || "-"}
                </td>

                <td className="max-w-xs px-3 py-4">
                  <p className="line-clamp-3 whitespace-pre-wrap break-words text-slate-300">
                    {app.notes || "-"}
                  </p>
                </td>

                <td className="px-3 py-4">
                  <button
                    onClick={() => deleteApplication(app.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )}
</div>
    </>
  );
}