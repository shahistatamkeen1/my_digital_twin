"use client";

import { useEffect, useState } from "react";

type CareerProfile = {
  targetRole: string;
  experienceLevel: string;
  preferredLocation: string;
  workPreference: string;
  salaryExpectation: string;
};

export default function RecommendationsPage() {
  const [resumeText, setResumeText] = useState("");
  const [careerProfile, setCareerProfile] = useState<CareerProfile | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedResume = localStorage.getItem("resumeText");
    const savedProfile = localStorage.getItem("careerProfile");

    if (savedResume) {
      setResumeText(savedResume);
    }

    if (savedProfile) {
      setCareerProfile(JSON.parse(savedProfile));
    }
  }, []);

  const generateRecommendations = async () => {
    if (!resumeText) {
      alert("Please upload your resume first.");
      return;
    }

    if (!careerProfile) {
      alert("Please complete your career profile first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recommendations/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume_text: resumeText,
          target_role: careerProfile.targetRole,
          experience_level: careerProfile.experienceLevel,
          preferred_location: careerProfile.preferredLocation,
          work_preference: careerProfile.workPreference,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      alert("Something went wrong while generating recommendations.");
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
      <h1 className="text-3xl font-bold">Career Recommendations</h1>

      <p className="mt-2 text-slate-400">
        Generate personalized career suggestions using your resume and profile.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold">Resume Status</h2>
          <p className="mt-3 text-slate-300">
            {resumeText ? "Resume text found." : "No resume uploaded yet."}
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold">Career Profile</h2>

          {careerProfile ? (
            <div className="mt-3 text-slate-300 space-y-1">
              <p>Target Role: {careerProfile.targetRole || "-"}</p>
              <p>Experience: {careerProfile.experienceLevel || "-"}</p>
              <p>Location: {careerProfile.preferredLocation || "-"}</p>
              <p>Work Type: {careerProfile.workPreference || "-"}</p>
            </div>
          ) : (
            <p className="mt-3 text-slate-300">
              No career profile saved yet.
            </p>
          )}
        </div>
      </div>

      <button
        onClick={generateRecommendations}
        disabled={loading}
        className="mt-6 bg-indigo-600 px-5 py-3 rounded-lg font-medium hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Recommendations"}
      </button>

      {result && (
        <div className="mt-8 space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl">
            <h2 className="text-xl font-semibold">Career Readiness Score</h2>
            <p className={`mt-4 text-5xl font-bold ${getScoreColor(result.career_readiness_score)}`}>
              {result.career_readiness_score}%
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl">
            <h2 className="text-xl font-semibold">Detected Skills</h2>
            <div className="flex flex-wrap gap-2 mt-4">
              {result.detected_skills.map((skill: string, index: number) => (
                <span
                  key={index}
                  className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl">
            <h2 className="text-xl font-semibold">Recommended Roles</h2>
            <ul className="list-disc list-inside text-slate-300 mt-3 space-y-2">
              {result.recommended_roles.map((role: string, index: number) => (
                <li key={index}>{role}</li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl">
            <h2 className="text-xl font-semibold">Skills to Improve</h2>
            <ul className="list-disc list-inside text-slate-300 mt-3 space-y-2">
              {result.skills_to_improve.map((skill: string, index: number) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl">
            <h2 className="text-xl font-semibold">Resume Suggestions</h2>
            <ul className="list-disc list-inside text-slate-300 mt-3 space-y-2">
              {result.resume_suggestions.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl">
            <h2 className="text-xl font-semibold">Next Actions</h2>
            <ul className="list-disc list-inside text-slate-300 mt-3 space-y-2">
              {result.next_actions.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-slate-500">{result.note}</p>
        </div>
      )}
    </main>
  );
}