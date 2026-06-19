"use client";

import { useEffect, useState } from "react";

export default function ATSResumePage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedResumeText = localStorage.getItem("resumeText");
    if (savedResumeText) {
      setResumeText(savedResumeText);
    }
  }, []);

  const optimizeResume = async () => {
    if (!resumeText || !jobDescription) {
      alert("Please paste both resume text and job description.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ats-resume/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      alert("Something went wrong while optimizing resume.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold">ATS Resume Optimizer</h1>

      <p className="mt-2 text-slate-400">
        Paste your resume and job description to generate ATS improvement suggestions.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-slate-900 p-6 rounded-xl">
          <label className="block mb-2 text-sm text-slate-300">
            Resume Text
          </label>

          <textarea
            rows={14}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="w-full bg-slate-800 rounded-lg p-4 outline-none text-sm"
            placeholder="Paste your resume text here..."
          />
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <label className="block mb-2 text-sm text-slate-300">
            Job Description
          </label>

          <textarea
            rows={14}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full bg-slate-800 rounded-lg p-4 outline-none text-sm"
            placeholder="Paste job description here..."
          />
        </div>
      </div>

      <button
        onClick={optimizeResume}
        disabled={loading}
        className="mt-6 bg-indigo-600 px-5 py-3 rounded-lg font-medium hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? "Optimizing..." : "Optimize Resume"}
      </button>

      {result && (
        <div className="mt-8 bg-slate-900 p-6 rounded-xl">
          <h2 className="text-2xl font-bold">ATS Optimization Result</h2>

          <p className={`mt-4 text-5xl font-bold ${getScoreColor(result.ats_score)}`}>
            {result.ats_score}%
          </p>

          <div className="mt-6">
            <h3 className="font-semibold">Missing Keywords</h3>

            {result.missing_keywords.length === 0 ? (
              <p className="text-green-400 mt-2">
                No major missing keywords found.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-3">
                {result.missing_keywords.map((keyword: string, index: number) => (
                  <span
                    key={index}
                    className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="font-semibold">Optimized Summary</h3>
            <p className="text-slate-300 mt-2">
              {result.optimized_summary}
            </p>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold">Optimized Resume Bullets</h3>

            <ul className="list-disc list-inside text-slate-300 mt-2 space-y-2">
              {result.optimized_bullets.map((bullet: string, index: number) => (
                <li key={index}>{bullet}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6 border-t border-slate-700 pt-4">
            <p className="text-sm text-slate-400">
              {result.note}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}