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
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">Career Profile</h1>
      <p className="mt-2 text-slate-400">
        Tell your Career Twin what kind of roles you are targeting.
      </p>

      <div className="mt-8 max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6 space-y-5">
        <div>
          <label className="block mb-2 text-sm text-slate-300">
            Target Role
          </label>
          <input
            name="targetRole"
            value={profile.targetRole}
            onChange={handleChange}
            placeholder="Software Engineer"
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
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
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
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
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
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
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
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
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <button
          onClick={saveProfile}
          className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 sm:w-auto"
        >
          Save Career Profile
        </button>

        {saved && (
          <p className="rounded-lg bg-green-500/10 p-3 text-green-400">
            Career profile saved successfully.
          </p>
        )}
      </div>
    </>
  );
}