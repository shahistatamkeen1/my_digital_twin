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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/`);
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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/`, {
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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/${id}`, {
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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/${id}`, {
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
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold">Application Tracker</h1>

      <p className="mt-2 text-slate-400">
        Track saved, applied, interview, offer, and rejected jobs.
      </p>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <h2 className="text-xl font-semibold">Add New Application</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <input
            name="company"
            value={form.company}
            onChange={handleChange}
            placeholder="Company"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <input
            name="role"
            value={form.role}
            onChange={handleChange}
            placeholder="Role"
            className="bg-slate-800 p-3 rounded-lg outline-none"
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
            className="bg-slate-800 p-3 rounded-lg outline-none md:col-span-2"
          />
        </div>

        <button
          onClick={addApplication}
          disabled={loading}
          className="mt-5 bg-indigo-600 px-5 py-3 rounded-lg font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Application"}
        </button>
      </div>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl overflow-x-auto">
        <h2 className="text-xl font-semibold mb-5">Tracked Applications</h2>

        {applications.length === 0 ? (
          <p className="text-slate-400">No applications added yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b border-slate-700">
              <tr>
                <th className="text-left py-3">Company</th>
                <th className="text-left py-3">Role</th>
                <th className="text-left py-3">Location</th>
                <th className="text-left py-3">Status</th>
                <th className="text-left py-3">Date</th>
                <th className="text-left py-3">Notes</th>
                <th className="text-left py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-slate-800">
                  <td className="py-3">{app.company}</td>
                  <td className="py-3">{app.role}</td>
                  <td className="py-3">{app.location || "-"}</td>
                  <td className="py-3">
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      className={`rounded-lg px-2 py-1 outline-none ${getStatusColor(app.status)}`}
                    >
                      <option value="Saved">Saved</option>
                      <option value="Applied">Applied</option>
                      <option value="Interview">Interview</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="py-3">{app.date_applied || "-"}</td>
                  <td className="py-3">{app.notes || "-"}</td>
                  <td className="py-3">
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
        )}
      </div>
    </main>
  );
}