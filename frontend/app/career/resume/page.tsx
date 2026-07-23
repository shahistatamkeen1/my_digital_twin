"use client";

import { apiFetch } from "@/lib/api";

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

      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resume/upload`, {
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
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">Resume Center</h1>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={uploadResume}
          disabled={loading}
          className="mt-3 w-full rounded-lg bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50 sm:mt-0 sm:w-auto"
        >
          {loading ? "Analyzing..." : "Upload Resume"}
        </button>

        <button
          onClick={clearResume}
          className="mt-3 w-full rounded-lg bg-red-600 px-5 py-3 font-medium hover:bg-red-500 sm:mt-0 sm:w-auto"
        >
          Clear Resume
        </button>
        </div>
      </div>

      {analysis && (
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">AI Resume Analysis</h2>

          <div className="mt-5">
            <p className="text-slate-400">Resume Score</p>
            <p className="mt-2 text-4xl font-bold text-indigo-400 sm:text-5xl">
              {analysis.resume_score ?? "--"}%
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
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

            <div className="rounded-lg bg-slate-800 p-5 xl:col-span-2">
              <h3 className="font-semibold">Improvement Suggestions</h3>
              {renderList(analysis.improvement_suggestions)}
            </div>
          </div>
        </div>
      )}

      {resumeText && (
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Extracted Resume Text</h2>

          <pre className="mt-4 max-h-[700px] max-w-full overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-800 p-4 font-sans text-sm leading-6 text-slate-300">
            {resumeText}
          </pre>
        </div>
      )}
    </>
  );
}