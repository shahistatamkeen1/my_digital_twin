"use client";

import { useEffect, useState } from "react";

export default function CoverLetterPage() {
  const [resumeText, setResumeText] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedResume = localStorage.getItem("resumeText");
    if (savedResume) setResumeText(savedResume);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/memory/`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.career_goal) setCareerGoal(data.career_goal);
      })
      .catch(() => {});
  }, []);

  const generateCoverLetter = async () => {
    if (!resumeText) {
      alert("Please upload your resume first in Resume Center.");
      return;
    }

    if (!company || !role || !jobDescription) {
      alert("Company, role, and job description are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cover-letter/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          company,
          role,
          job_description: jobDescription,
          career_goal: careerGoal,
        }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setCoverLetter(data.cover_letter);
    } catch (error) {
      console.error("Cover letter error:", error);
      alert("Could not generate cover letter.");
    } finally {
      setLoading(false);
    }
  };

  const copyCoverLetter = () => {
    navigator.clipboard.writeText(coverLetter);
    alert("Cover letter copied.");
  };

  return (
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">Cover Letter Agent</h1>

      <p className="mt-2 text-slate-400">
        Generate a professional cover letter using your resume, career memory,
        and job description.
      </p>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company"
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-pink-500/40"
          />

          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role"
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-pink-500/40"
          />

          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description here..."
            rows={10}
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-pink-500/40 lg:col-span-2"
          />
        </div>

        <button
          onClick={generateCoverLetter}
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-pink-600 px-5 py-3 font-medium hover:bg-pink-500 disabled:opacity-50 sm:w-auto"
        >
          {loading ? "Generating..." : "Generate Cover Letter"}
        </button>
      </div>

      {coverLetter && (
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Generated Cover Letter</h2>

            <button
              onClick={copyCoverLetter}
              className="w-full rounded-lg bg-slate-700 px-4 py-2.5 hover:bg-slate-600 sm:w-auto"
            >
              Copy
            </button>
          </div>

          <pre className="mt-5 max-h-[800px] max-w-full overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-800 p-5 font-sans text-sm leading-6 text-slate-300">
            {coverLetter}
          </pre>
        </div>
      )}
    </>
  );
}