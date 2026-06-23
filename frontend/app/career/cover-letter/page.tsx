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
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold">Cover Letter Agent</h1>

      <p className="mt-2 text-slate-400">
        Generate a professional cover letter using your resume, career memory,
        and job description.
      </p>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description here..."
            rows={10}
            className="bg-slate-800 p-3 rounded-lg outline-none md:col-span-2"
          />
        </div>

        <button
          onClick={generateCoverLetter}
          disabled={loading}
          className="mt-5 bg-pink-600 px-5 py-3 rounded-lg hover:bg-pink-500 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Cover Letter"}
        </button>
      </div>

      {coverLetter && (
        <div className="mt-8 bg-slate-900 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Generated Cover Letter</h2>

            <button
              onClick={copyCoverLetter}
              className="bg-slate-700 px-4 py-2 rounded-lg hover:bg-slate-600"
            >
              Copy
            </button>
          </div>

          <pre className="mt-5 whitespace-pre-wrap text-sm text-slate-300 bg-slate-800 p-5 rounded-lg">
            {coverLetter}
          </pre>
        </div>
      )}
    </main>
  );
}