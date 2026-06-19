"use client";

import { useEffect, useState } from "react";

export default function CareerProfilePage() {
  const [profile, setProfile] = useState({
    targetRole: "",
    experienceLevel: "",
    preferredLocation: "",
    workPreference: "",
    salaryExpectation: "",
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
  const storedProfile = localStorage.getItem("careerProfile");
  if (storedProfile) {
    setProfile(JSON.parse(storedProfile));
  }
}, []);

  const saveProfile = () => {
    localStorage.setItem("careerProfile", JSON.stringify(profile));
    setSaved(true);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold">Career Profile</h1>
      <p className="mt-2 text-slate-400">
        Tell your Career Twin what kind of roles you are targeting.
      </p>

      <div className="mt-8 max-w-2xl bg-slate-900 p-6 rounded-xl space-y-5">
        <div>
          <label className="block mb-2 text-sm text-slate-300">
            Target Role
          </label>
          <input
            name="targetRole"
            value={profile.targetRole}
            onChange={handleChange}
            placeholder="Software Engineer"
            className="w-full rounded-lg bg-slate-800 p-3 outline-none"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm text-slate-300">
            Experience Level
          </label>
          <select
            name="experienceLevel"
            value={profile.experienceLevel}
            onChange={handleChange}
            className="w-full rounded-lg bg-slate-800 p-3 outline-none"
          >
            <option value="">Select level</option>
            <option value="Entry Level">Entry Level</option>
            <option value="Junior">Junior</option>
            <option value="Mid Level">Mid Level</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm text-slate-300">
            Preferred Location
          </label>
          <input
            name="preferredLocation"
            value={profile.preferredLocation}
            onChange={handleChange}
            placeholder="Chicago, Remote, New York"
            className="w-full rounded-lg bg-slate-800 p-3 outline-none"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm text-slate-300">
            Work Preference
          </label>
          <select
            name="workPreference"
            value={profile.workPreference}
            onChange={handleChange}
            className="w-full rounded-lg bg-slate-800 p-3 outline-none"
          >
            <option value="">Select preference</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
            <option value="Any">Any</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm text-slate-300">
            Salary Expectation
          </label>
          <input
            name="salaryExpectation"
            value={profile.salaryExpectation}
            onChange={handleChange}
            placeholder="90000"
            className="w-full rounded-lg bg-slate-800 p-3 outline-none"
          />
        </div>

        <button
          onClick={saveProfile}
          className="rounded-lg bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500"
        >
          Save Career Profile
        </button>

        {saved && (
          <p className="text-green-400">
            Career profile saved successfully.
          </p>
        )}
      </div>
    </main>
  );
}