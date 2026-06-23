"use client";

import { useEffect, useState } from "react";

type ResumeAnalysis = {
  resume_score?: number;
  top_skills?: string[];
  recommended_roles?: string[];
  strengths?: string[];
  weaknesses?: string[];
  improvement_suggestions?: string[];
};

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedResume = localStorage.getItem("resumeText");
    if (savedResume) {
      setResumeText(savedResume);
    }

    const savedAnalysis = localStorage.getItem("resumeAnalysis");
    if (savedAnalysis) {
      setAnalysis(JSON.parse(savedAnalysis));
    }
  }, []);

  const uploadResume = async () => {
    if (!file) return alert("Please select a PDF resume");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resume/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setResumeText(data.text);
      setAnalysis(data.analysis);

      localStorage.setItem("resumeText", data.text);
      localStorage.setItem("resumeAnalysis", JSON.stringify(data.analysis));
    } catch (error) {
      console.error("Resume upload error:", error);
      alert("Could not upload resume.");
    } finally {
      setLoading(false);
    }
  };

  const clearResume = () => {
    localStorage.removeItem("resumeText");
    localStorage.removeItem("resumeAnalysis");
    setResumeText("");
    setAnalysis(null);
    setFile(null);
  };

  const renderList = (items?: string[]) => {
    if (!items || items.length === 0) {
      return <p className="text-slate-400 mt-2">No data available.</p>;
    }

    return (
      <ul className="list-disc list-inside text-slate-300 mt-2 space-y-1">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold">Resume Center</h1>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={uploadResume}
          disabled={loading}
          className="ml-4 bg-indigo-600 px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Upload Resume"}
        </button>

        <button
          onClick={clearResume}
          className="ml-4 bg-red-600 px-4 py-2 rounded-lg"
        >
          Clear Resume
        </button>
      </div>

      {analysis && (
        <div className="mt-8 bg-slate-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold">AI Resume Analysis</h2>

          <div className="mt-5">
            <p className="text-slate-400">Resume Score</p>
            <p className="text-5xl font-bold text-indigo-400 mt-2">
              {analysis.resume_score ?? "--"}%
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-slate-800 p-5 rounded-lg">
              <h3 className="font-semibold">Top Skills</h3>
              {renderList(analysis.top_skills)}
            </div>

            <div className="bg-slate-800 p-5 rounded-lg">
              <h3 className="font-semibold">Recommended Roles</h3>
              {renderList(analysis.recommended_roles)}
            </div>

            <div className="bg-slate-800 p-5 rounded-lg">
              <h3 className="font-semibold">Strengths</h3>
              {renderList(analysis.strengths)}
            </div>

            <div className="bg-slate-800 p-5 rounded-lg">
              <h3 className="font-semibold">Weaknesses</h3>
              {renderList(analysis.weaknesses)}
            </div>

            <div className="bg-slate-800 p-5 rounded-lg md:col-span-2">
              <h3 className="font-semibold">Improvement Suggestions</h3>
              {renderList(analysis.improvement_suggestions)}
            </div>
          </div>
        </div>
      )}

      {resumeText && (
        <div className="mt-8 bg-slate-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold">Extracted Resume Text</h2>

          <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-300">
            {resumeText}
          </pre>
        </div>
      )}
    </main>
  );
}