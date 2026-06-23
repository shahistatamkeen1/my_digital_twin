"use client";

import { useState } from "react";

type SampleAnswer = {
  question: string;
  answer: string;
};

type InterviewResult = {
  readiness_score: number;
  technical_questions: string[];
  behavioral_questions: string[];
  system_design_questions: string[];
  sample_answers: SampleAnswer[];
};

export default function InterviewPrepPage() {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInterview = async () => {
    if (!role || !company) {
      alert("Role and company are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interview/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          company,
          job_description: jobDescription || role,
        }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setResult(data);
    } catch (error) {
      console.error("Interview generation error:", error);
      alert("Interview generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const renderQuestions = (items?: string[]) => {
    if (!items || items.length === 0) {
      return <p className="text-slate-400">No questions generated.</p>;
    }

    return (
      <ul className="list-decimal list-inside space-y-2 text-slate-300">
        {items.map((q, index) => (
          <li key={index}>{q}</li>
        ))}
      </ul>
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold">Interview Preparation Agent</h1>

      <p className="mt-2 text-slate-400">
        Generate role-specific technical, behavioral, and system design interview questions.
      </p>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <div className="space-y-4">
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role"
            className="w-full p-3 bg-slate-800 rounded-lg outline-none"
          />

          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company"
            className="w-full p-3 bg-slate-800 rounded-lg outline-none"
          />

          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Optional: Paste job description here..."
            rows={8}
            className="w-full p-3 bg-slate-800 rounded-lg outline-none"
          />

          <button
            onClick={generateInterview}
            disabled={loading}
            className="px-5 py-3 bg-purple-600 rounded-lg hover:bg-purple-500 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Interview Questions"}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-8 space-y-6">
          <div className="bg-slate-900 p-5 rounded-xl">
            <h2 className="text-xl font-bold">Interview Readiness Score</h2>

            <div className="text-5xl font-bold text-purple-400 mt-3">
              {result.readiness_score}%
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-xl">
            <h2 className="font-bold text-xl mb-3">Technical Questions</h2>
            {renderQuestions(result.technical_questions)}
          </div>

          <div className="bg-slate-900 p-5 rounded-xl">
            <h2 className="font-bold text-xl mb-3">Behavioral Questions</h2>
            {renderQuestions(result.behavioral_questions)}
          </div>

          <div className="bg-slate-900 p-5 rounded-xl">
            <h2 className="font-bold text-xl mb-3">System Design Questions</h2>
            {renderQuestions(result.system_design_questions)}
          </div>

          <div className="bg-slate-900 p-5 rounded-xl">
            <h2 className="font-bold text-xl mb-4">Sample Answers</h2>

            <div className="space-y-5">
              {result.sample_answers?.map((item, index) => (
                <div
                  key={index}
                  className="border border-slate-700 rounded-lg p-4 bg-slate-800"
                >
                  <h3 className="font-semibold text-purple-400">
                    {item.question}
                  </h3>

                  <p className="text-slate-300 mt-2">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}