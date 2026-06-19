"use client";

import { useState } from "react";

export default function InterviewPrepPage() {

  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [result, setResult] = useState<any>(null);
const [loading, setLoading] = useState(false);

const generateInterview = async () => {
  try {
    setLoading(true);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/interview/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          company,
          job_description: role,
        }),
      }
    );

    const data = await res.json();

    setResult(data);
  } catch (error) {
    console.error(error);
    alert("Interview generation failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-6">
        Interview Preparation Agent
      </h1>

      <div className="space-y-4">

        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role"
          className="w-full p-3 bg-slate-800 rounded"
        />

        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company"
          className="w-full p-3 bg-slate-800 rounded"
        />

        <button
          onClick={generateInterview}
          className="px-5 py-3 bg-purple-600 rounded"
        >
          {loading ? "Generating..." : "Generate Interview Questions"}
        </button>

      </div>

{result && (
  <div className="mt-8 space-y-6">

    <div className="bg-slate-900 p-5 rounded">
      <h2 className="text-xl font-bold">
        Interview Readiness Score
      </h2>

      <div className="text-5xl font-bold text-purple-400 mt-3">
        {result.readiness_score}%
      </div>
    </div>

    <div className="bg-slate-900 p-5 rounded">
      <h2 className="font-bold text-xl mb-3">
        Technical Questions
      </h2>

      <ul className="space-y-2">
        {result.technical_questions?.map(
          (q: string, index: number) => (
            <li key={index}>
              {index + 1}. {q}
            </li>
          )
        )}
      </ul>
    </div>

    <div className="bg-slate-900 p-5 rounded">
      <h2 className="font-bold text-xl mb-3">
        Behavioral Questions
      </h2>

      <ul className="space-y-2">
        {result.behavioral_questions?.map(
          (q: string, index: number) => (
            <li key={index}>
              {index + 1}. {q}
            </li>
          )
        )}
      </ul>
    </div>

    <div className="bg-slate-900 p-5 rounded">
      <h2 className="font-bold text-xl mb-3">
        System Design Questions
      </h2>

      <ul className="space-y-2">
        {result.system_design_questions?.map(
          (q: string, index: number) => (
            <li key={index}>
              {index + 1}. {q}
            </li>
          )
        )}
      </ul>
    </div>

<div className="bg-slate-900 p-5 rounded">
  <h2 className="font-bold text-xl mb-4">
    Sample Answers
  </h2>

  <div className="space-y-6">

    {result.sample_answers?.map(
      (
        item: {
          question: string;
          answer: string;
        },
        index: number
      ) => (
        <div
          key={index}
          className="border border-slate-700 rounded p-4"
        >
          <h3 className="font-semibold text-purple-400 mb-2">
            {item.question}
          </h3>

          <p className="text-slate-300">
            {item.answer}
          </p>
        </div>
      )
    )}

  </div>
</div>

  </div>
)}
    </main>
  );
}