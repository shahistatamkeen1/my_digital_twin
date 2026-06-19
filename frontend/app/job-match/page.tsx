"use client";

import { useEffect, useState } from "react";

export default function JobMatchPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const savedResumeText = localStorage.getItem("resumeText");
    if (savedResumeText) {
      setResumeText(savedResumeText);
    }
  }, []);

  const analyzeMatch = async () => {
    if (!resumeText || !jobDescription) {
      alert("Please paste both resume text and job description.");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/job-match/`, {
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
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold">Job Match Scoring</h1>
      <p className="mt-2 text-slate-400">
        Paste your resume text and job description to calculate match score.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-slate-900 p-6 rounded-xl">
          <label className="block mb-2 text-sm text-slate-300">
            Resume Text
          </label>
          <textarea
            rows={12}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="w-full bg-slate-800 rounded-lg p-4 outline-none text-sm"
            placeholder="Paste resume text here..."
          />
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <label className="block mb-2 text-sm text-slate-300">
            Job Description
          </label>
          <textarea
            rows={12}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full bg-slate-800 rounded-lg p-4 outline-none text-sm"
            placeholder="Paste job description here..."
          />
        </div>
      </div>

      <button
        onClick={analyzeMatch}
        className="mt-6 bg-indigo-600 px-5 py-3 rounded-lg font-medium hover:bg-indigo-500"
      >
        Analyze Match
      </button>

      {result && (
        <div className="mt-8 bg-slate-900 p-6 rounded-xl">
          <h2 className="text-2xl font-bold">Match Result</h2>

          <p className={`mt-4 text-4xl font-bold ${getScoreColor(result.match_score)}`}>
            {result.match_score}%
          </p>

          <div className="mt-6">
            <h3 className="font-semibold">Missing Skills</h3>
            <ul className="list-disc list-inside text-slate-300 mt-2">
              {result.missing_skills.map((skill: string, index: number) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold">Keywords to Add</h3>
            <ul className="list-disc list-inside text-slate-300 mt-2">
              {result.keywords_to_add.map((keyword: string, index: number) => (
                <li key={index}>{keyword}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold">Recommendation</h3>
            <p className="text-slate-300 mt-2">{result.recommendation}</p>
          </div>
        </div>
      )}
    </main>
  );
}