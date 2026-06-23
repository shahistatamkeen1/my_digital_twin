"use client";

import { useEffect, useState } from "react";

type Job = {
  id: string;
  company: string;
  role: string;
  location: string;
  description: string;
  url: string;
  salary_min?: number;
  salary_max?: number;
  created?: string;
  source?: string;
};

type CareerMemory = {
  id?: number;
  career_goal: string;
  target_role: string;
  current_skills: string;
  skills_to_learn: string;
  notes: string;
};

type MatchResult = {
  match_score: number;
  missing_skills: string[];
  keywords_to_add: string[];
  recommendation: string;
};

type ATSResult = {
  ats_score: number;
  missing_keywords: string[];
  keywords_to_add: string[];
  optimized_summary: string;
  optimized_bullets: string[];
  note: string;
};

type InterviewResult = {
  readiness_score: number;
  technical_questions: string[];
  behavioral_questions: string[];
  system_design_questions: string[];
  sample_answers: {
    question: string;
    answer: string;
  }[];
};

type CoverLetterResult = {
  cover_letter: string;
};

type AutofillResult = {
  tell_me_about_yourself: string;
  why_this_role: string;
  why_this_company: string;
  why_should_we_hire_you: string;
  work_authorization: string;
  sponsorship: string;
  salary_expectation: string;
  availability: string;
  additional_information: string;
};

type TailoredResumeResult = {
  tailored_resume_score: number;
  target_role: string;
  keywords_added: string[];
  optimized_summary: string;
  optimized_skills: string[];
  optimized_experience_bullets: string[];
  recommended_projects_to_highlight: string[];
  missing_gaps: string[];
  final_notes: string;
};

export default function JobDiscoveryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [memory, setMemory] = useState<CareerMemory | null>(null);
  const [role, setRole] = useState("Software Engineer");
  const [location, setLocation] = useState("remote");
  const [loading, setLoading] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Record<string, number>>({});
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [resumeText, setResumeText] = useState("");
  const [matchResults, setMatchResults] = useState<Record<string, MatchResult>>({});
  const [analyzingJobId, setAnalyzingJobId] = useState<string | null>(null);
  const [atsResults, setAtsResults] = useState<Record<string, ATSResult>>({});
  const [interviewResults, setInterviewResults] = useState<
  Record<string, InterviewResult>
  
>({});

const [generatingInterviewJobId, setGeneratingInterviewJobId] =
  useState<string | null>(null);
  const [generatingAtsJobId, setGeneratingAtsJobId] = useState<string | null>(null);

  const [coverLetters, setCoverLetters] = useState<Record<string, CoverLetterResult>>({});
const [generatingCoverLetterJobId, setGeneratingCoverLetterJobId] = useState<string | null>(null);
const [autofillResults, setAutofillResults] = useState<Record<string, AutofillResult>>({});
const [generatingAutofillJobId, setGeneratingAutofillJobId] = useState<string | null>(null);
const [tailoredResumes, setTailoredResumes] = useState<Record<string, TailoredResumeResult>>({});
const [tailoringJobId, setTailoringJobId] = useState<string | null>(null);

  const normalizeLocation = (value: string) => {
    const clean = value.trim().toLowerCase();

    if (!clean) return "remote";

    if (
      clean === "on-site" ||
      clean === "onsite" ||
      clean === "hybrid" ||
      clean === "any"
    ) {
      return "remote";
    }

    return value.trim();
  };


  const fetchMemory = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/memory/`);
      const data = await res.json();

      if (data) {
        setMemory(data);

        if (data.target_role) {
          setRole(data.target_role);
        }

        const memoryText = `${data.career_goal || ""} ${data.target_role || ""} ${
          data.current_skills || ""
        } ${data.skills_to_learn || ""} ${data.notes || ""}`.toLowerCase();

        if (memoryText.includes("chicago")) {
          setLocation("Chicago");
        } else if (memoryText.includes("remote")) {
          setLocation("remote");
        } else {
          setLocation("remote");
        }
      }
    } catch (error) {
      console.log("No memory found", error);
    }
  };

  useEffect(() => {
    fetchMemory();

    const savedResume = localStorage.getItem("resumeText");
    if (savedResume) {
      setResumeText(savedResume);
    }
  }, []);

  const searchJobs = async () => {
    setLoading(true);

    try {
      const cleanLocation = normalizeLocation(location);

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/jobs/search?role=${encodeURIComponent(
        role
      )}&location=${encodeURIComponent(cleanLocation)}&country=us`;

      console.log("Calling jobs API:", apiUrl);

      const res = await fetch(apiUrl);

      if (!res.ok) {
        alert("Jobs API failed.");
        return;
      }

      const data = await res.json();

      console.log("Jobs API response:", data);

      if (data.error) {
        alert(data.error);
        return;
      }

      if (!data.jobs || data.jobs.length === 0) {
        alert("No jobs found for this search.");
        setJobs([]);
        return;
      }

      setLocation(cleanLocation);
      setJobs(data.jobs);
    } catch (error) {
      console.error("Job fetch error:", error);
      alert("Could not fetch real jobs.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeJobMatch = async (job: Job) => {
    if (!resumeText) {
      alert("Please upload your resume first in Resume Center.");
      return;
    }

    setAnalyzingJobId(job.id);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/job-match/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: job.description,
        }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setMatchResults((prev) => ({
        ...prev,
        [job.id]: data,
      }));
    } catch (error) {
      console.error("Analyze match error:", error);
      alert("Could not analyze job match.");
    } finally {
      setAnalyzingJobId(null);
    }
  };

const saveJob = async (job: Job) => {
  const match = matchResults[job.id];
  const ats = atsResults[job.id];

  const aiNotes = `
Saved from real Job Discovery.
Source: ${job.source || "Unknown"}
Apply link: ${job.url}

AI Match Analysis:
Match Score: ${match?.match_score ?? "Not analyzed"}%
Missing Skills: ${match?.missing_skills?.join(", ") || "Not analyzed"}
Keywords to Add: ${match?.keywords_to_add?.join(", ") || "Not analyzed"}
Recommendation: ${match?.recommendation || "Not analyzed"}

ATS Resume Optimization:
ATS Score: ${ats?.ats_score ?? "Not generated"}%
Missing Keywords: ${ats?.missing_keywords?.join(", ") || "Not generated"}
Keywords to Add: ${ats?.keywords_to_add?.join(", ") || "Not generated"}
Optimized Summary: ${ats?.optimized_summary || "Not generated"}
Optimized Bullets:
${ats?.optimized_bullets?.map((bullet: string) => `- ${bullet}`).join("\n") || "Not generated"}
`;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company: job.company,
        role: job.role,
        location: job.location,
        status: "Saved",
        date_applied: "",
        notes: aiNotes,
      }),
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);

      if (data.existing_application?.id) {
        setSavedJobs((prev) => ({
          ...prev,
          [job.id]: data.existing_application.id,
        }));
      }

      return;
    }

    setSavedJobs((prev) => ({
      ...prev,
      [job.id]: data.id,
    }));
  } catch (error) {
    console.error("Save job error:", error);
    alert("Could not save job.");
  }
};

  const markApplied = async (job: Job) => {
    const applicationId = savedJobs[job.id];

    if (!applicationId) {
      alert("Please save this job first.");
      return;
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Applied",
        }),
      });

      setAppliedJobs((prev) =>
        prev.includes(job.id) ? prev : [...prev, job.id]
      );
    } catch (error) {
      console.error("Mark applied error:", error);
      alert("Could not mark as applied.");
    }
  };

  const generateATSResume = async (job: Job) => {
  if (!resumeText) {
    alert("Please upload your resume first in Resume Center.");
    return;
  }

  setGeneratingAtsJobId(job.id);

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ats-resume/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resume_text: resumeText,
        job_description: job.description,
      }),
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    setAtsResults((prev) => ({
      ...prev,
      [job.id]: data,
    }));

    await tailorResumeForJob(job);
  } catch (error) {
    console.error("ATS resume error:", error);
    alert("Could not generate ATS resume.");
  } finally {
    setGeneratingAtsJobId(null);
  }
};

const generateInterviewPrep = async (job: Job) => {

  setGeneratingInterviewJobId(job.id);

  try {

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/interview/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: job.role,
          company: job.company,
          job_description: job.description,
        }),
      }
    );

    const data = await res.json();

    setInterviewResults((prev) => ({
      ...prev,
      [job.id]: data,
    }));

  } catch (error) {

    console.error(error);
    alert("Failed to generate interview prep.");

  } finally {

    setGeneratingInterviewJobId(null);

  }
};



const generateCoverLetterForJob = async (job: Job) => {
  if (!resumeText) {
    alert("Please upload your resume first in Resume Center.");
    return;
  }

  setGeneratingCoverLetterJobId(job.id);

  try {
    const careerGoal = memory?.career_goal || "";

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cover-letter/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resume_text: resumeText,
        company: job.company,
        role: job.role,
        job_description: job.description,
        career_goal: careerGoal,
      }),
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    setCoverLetters((prev) => ({
      ...prev,
      [job.id]: data,
    }));
  } catch (error) {
    console.error("Cover letter error:", error);
    alert("Could not generate cover letter.");
  } finally {
    setGeneratingCoverLetterJobId(null);
  }
};

const generateAutofillAnswers = async (job: Job) => {
  console.log("Autofill clicked for:", job);
  if (!resumeText) {
    alert("Please upload your resume first in Resume Center.");
    return;
  }

  setGeneratingAutofillJobId(job.id);

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/autofill/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resume_text: resumeText,
        company: job.company,
        role: job.role,
        job_description: job.description,
        career_goal: memory?.career_goal || "",
      }),
    });

    const data = await res.json();
    console.log("Autofill response:", data);

    if (data.error) {
      alert(data.error);
      return;
    }

    setAutofillResults((prev) => ({
      ...prev,
      [job.id]: data,
    }));
  } catch (error) {
    console.error("Autofill error:", error);
    alert("Could not generate autofill answers.");
  } finally {
    setGeneratingAutofillJobId(null);
  }
};

const tailorResumeForJob = async (job: Job) => {
  if (!resumeText) {
    alert("Please upload your resume first in Resume Center.");
    return;
  }

  setTailoringJobId(job.id);

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resume-tailor/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resume_text: resumeText,
        job_description: job.description,
        company: job.company,
        role: job.role,
      }),
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    setTailoredResumes((prev) => ({
      ...prev,
      [job.id]: data,
    }));
  } catch (error) {
    console.error("Resume tailoring error:", error);
    alert("Could not tailor resume.");
  } finally {
    setTailoringJobId(null);
  }
};

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold">Real Job Discovery</h1>

      <p className="mt-2 text-slate-400">
        Search real job postings using your Career Memory and analyze fit using AI.
      </p>

      {memory && (
        <div className="mt-8 bg-slate-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold">Personalization Source</h2>

          <p className="mt-3 text-slate-300">
            Target Role:{" "}
            <span className="text-white font-medium">
              {memory.target_role || "-"}
            </span>
          </p>

          <p className="text-slate-300">
            Notes:{" "}
            <span className="text-white font-medium">
              {memory.notes || "-"}
            </span>
          </p>

          <p className="text-slate-300">
            Resume Status:{" "}
            <span className="text-white font-medium">
              {resumeText ? "Resume loaded" : "No resume uploaded"}
            </span>
          </p>
        </div>
      )}

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <h2 className="text-xl font-semibold">Search Jobs</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="AI Engineer"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Chicago or remote"
            className="bg-slate-800 p-3 rounded-lg outline-none"
          />

          <button
            onClick={searchJobs}
            disabled={loading}
            className="bg-indigo-600 px-5 py-3 rounded-lg font-medium hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search Real Jobs"}
          </button>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-8 bg-slate-900 p-6 rounded-xl">
          <p className="text-slate-400">
            No jobs loaded yet. Click Search Real Jobs to fetch live jobs.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-slate-900 p-6 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{job.role}</h2>
                  <p className="text-slate-400 mt-1">{job.company}</p>
                  <p className="text-slate-500 text-sm mt-1">{job.location}</p>
                </div>

                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full">
                  {job.source || "Job"}
                </span>
              </div>

              <p className="mt-5 text-slate-300 text-sm">
                {job.description
                  ? `${job.description.replace(/<[^>]*>/g, "").slice(0, 350)}...`
                  : "No description available."}
              </p>

              {(job.salary_min || job.salary_max) && (
                <p className="mt-4 text-sm text-green-400">
                  Salary: {job.salary_min || "?"} - {job.salary_max || "?"}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-700 px-4 py-2 rounded-lg hover:bg-slate-600"
                >
                  View Job
                </a>

                <button
                  onClick={() => analyzeJobMatch(job)}
                  disabled={analyzingJobId === job.id}
                  className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-500 disabled:opacity-50"
                >
                  {analyzingJobId === job.id ? "Analyzing..." : "Analyze Match"}
                </button>

                <button
  onClick={() => generateATSResume(job)}
  disabled={generatingAtsJobId === job.id}
  className="bg-cyan-600 px-4 py-2 rounded-lg hover:bg-cyan-500 disabled:opacity-50"
>
  {generatingAtsJobId === job.id ? "Generating..." : "ATS Optimizer"}
</button>

<button
  onClick={() => generateInterviewPrep(job)}
  disabled={generatingInterviewJobId === job.id}
  className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-500 disabled:opacity-50"
>
  {generatingInterviewJobId === job.id
    ? "Generating..."
    : "Prepare Interview"}
</button>

<button
  onClick={() => generateCoverLetterForJob(job)}
  disabled={generatingCoverLetterJobId === job.id}
  className="bg-pink-600 px-4 py-2 rounded-lg hover:bg-pink-500 disabled:opacity-50"
>
  {generatingCoverLetterJobId === job.id ? "Generating..." : "Generate Cover Letter"}
</button>

<button
  onClick={() => generateAutofillAnswers(job)}
  disabled={generatingAutofillJobId === job.id}
  className="bg-orange-600 px-4 py-2 rounded-lg hover:bg-orange-500 disabled:opacity-50"
>
  {generatingAutofillJobId === job.id ? "Generating..." : "Autofill Answers"}
</button>


                {!savedJobs[job.id] ? (
                  <button
                    onClick={() => saveJob(job)}
                    className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500"
                  >
                    Save to Applications
                  </button>
                ) : (
                  <button
                    disabled
                    className="bg-slate-700 px-4 py-2 rounded-lg text-slate-300"
                  >
                    Saved
                  </button>
                )}

                {savedJobs[job.id] && (
                  <button
                    onClick={() => markApplied(job)}
                    disabled={appliedJobs.includes(job.id)}
                    className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500 disabled:opacity-50"
                  >
                    {appliedJobs.includes(job.id) ? "Applied" : "Mark as Applied"}
                  </button>
                )}
              </div>

              {matchResults[job.id] && (
                <div className="mt-5 bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold">AI Match Analysis</h3>

                  <p className="mt-3 text-3xl font-bold text-indigo-400">
                    {matchResults[job.id].match_score}%
                  </p>

                  <p className="mt-4 font-medium">Missing Skills</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {matchResults[job.id].missing_skills?.map(
                      (skill: string, index: number) => (
                        <span
                          key={index}
                          className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>

                  <p className="mt-4 font-medium">Keywords to Add</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {matchResults[job.id].keywords_to_add?.map(
                      (keyword: string, index: number) => (
                        <span
                          key={index}
                          className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs"
                        >
                          {keyword}
                        </span>
                      )
                    )}
                  </div>

                  <p className="mt-4 font-medium">Recommendation</p>
                  <p className="text-slate-300 text-sm mt-2">
                    {matchResults[job.id].recommendation}
                  </p>
                </div>
              )}

              {atsResults[job.id] && (
  <div className="mt-5 bg-slate-800 p-4 rounded-lg">
    <h3 className="font-semibold">ATS Resume Optimization</h3>

    <p className="mt-3 text-3xl font-bold text-cyan-400">
      {atsResults[job.id].ats_score}%
    </p>

    <p className="mt-4 font-medium">Missing Keywords</p>
    <div className="flex flex-wrap gap-2 mt-2">
      {atsResults[job.id].missing_keywords?.map(
        (keyword: string, index: number) => (
          <span
            key={index}
            className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs"
          >
            {keyword}
          </span>
        )
      )}
    </div>

    <p className="mt-4 font-medium">Keywords to Add</p>
    <div className="flex flex-wrap gap-2 mt-2">
      {atsResults[job.id].keywords_to_add?.map(
        (keyword: string, index: number) => (
          <span
            key={index}
            className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs"
          >
            {keyword}
          </span>
        )
      )}
    </div>

    <p className="mt-4 font-medium">Optimized Summary</p>
    <p className="text-slate-300 text-sm mt-2">
      {atsResults[job.id].optimized_summary}
    </p>

    <p className="mt-4 font-medium">Optimized Resume Bullets</p>
    <ul className="list-disc list-inside text-slate-300 text-sm mt-2 space-y-1">
      {atsResults[job.id].optimized_bullets?.map(
        (bullet: string, index: number) => (
          <li key={index}>{bullet}</li>
        )
      )}
    </ul>

    {atsResults[job.id].note && (
      <p className="mt-4 text-xs text-slate-400">
        {atsResults[job.id].note}
      </p>
    )}
  </div>
)}

    {interviewResults[job.id] && (

  <div className="mt-5 bg-slate-800 p-5 rounded-lg">

    <h3 className="text-xl font-semibold">
      Interview Preparation
    </h3>

    <div className="mt-4">
      <p className="text-slate-400">
        Readiness Score
      </p>

      <p className="text-4xl font-bold text-purple-400">
        {interviewResults[job.id].readiness_score}%
      </p>
    </div>

    <div className="mt-6">

      <h4 className="font-semibold">
        Technical Questions
      </h4>

      <ul className="list-disc ml-6 mt-2">
        {interviewResults[job.id].technical_questions?.map(
          (q, index) => (
            <li key={index}>{q}</li>
          )
        )}
      </ul>

    </div>

    <div className="mt-6">

      <h4 className="font-semibold">
        Behavioral Questions
      </h4>

      <ul className="list-disc ml-6 mt-2">
        {interviewResults[job.id].behavioral_questions?.map(
          (q, index) => (
            <li key={index}>{q}</li>
          )
        )}
      </ul>

    </div>

    <div className="mt-6">

      <h4 className="font-semibold">
        System Design Questions
      </h4>

      <ul className="list-disc ml-6 mt-2">
        {interviewResults[job.id].system_design_questions?.map(
          (q, index) => (
            <li key={index}>{q}</li>
          )
        )}
      </ul>

    </div>

  </div>

)}

{coverLetters[job.id] && (
  <div className="mt-5 bg-slate-800 p-5 rounded-lg">
    <h3 className="text-xl font-semibold">Generated Cover Letter</h3>

    <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-300 bg-slate-900 p-4 rounded-lg max-h-96 overflow-auto">
      {coverLetters[job.id].cover_letter}
    </pre>

    <button
      onClick={() => navigator.clipboard.writeText(coverLetters[job.id].cover_letter)}
      className="mt-4 bg-pink-600 px-4 py-2 rounded-lg hover:bg-pink-500"
    >
      Copy Cover Letter
    </button>
  </div>
)}

{autofillResults[job.id] && (
  <div className="mt-5 bg-slate-800 p-5 rounded-lg">
    <h3 className="text-xl font-semibold">Application Autofill Answers</h3>

    {Object.entries(autofillResults[job.id]).map(([key, value]) => (
      <div key={key} className="mt-4 bg-slate-900 p-4 rounded-lg">
        <p className="text-orange-300 font-medium capitalize">
          {key.replaceAll("_", " ")}
        </p>

        <p className="text-slate-300 text-sm mt-2 whitespace-pre-wrap">
          {String(value)}
        </p>

        <button
          onClick={() => navigator.clipboard.writeText(String(value))}
          className="mt-3 bg-slate-700 px-3 py-1 rounded text-sm hover:bg-slate-600"
        >
          Copy
        </button>
      </div>
    ))}
  </div>
)}

{tailoredResumes[job.id] && (
  <div className="mt-5 bg-slate-800 p-5 rounded-lg">
    <h3 className="text-xl font-semibold">Resume Tailoring Suggestions</h3>

    <p className="mt-3 text-3xl font-bold text-emerald-400">
      {tailoredResumes[job.id].tailored_resume_score}%
    </p>

    <p className="mt-4 font-medium">Optimized Summary</p>
    <p className="text-slate-300 text-sm mt-2 whitespace-pre-wrap">
      {tailoredResumes[job.id].optimized_summary}
    </p>

    <p className="mt-4 font-medium">Keywords Added</p>
    <div className="flex flex-wrap gap-2 mt-2">
      {tailoredResumes[job.id].keywords_added?.map((item, index) => (
        <span
          key={index}
          className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs"
        >
          {item}
        </span>
      ))}
    </div>

    <p className="mt-4 font-medium">Optimized Skills</p>
    <div className="flex flex-wrap gap-2 mt-2">
      {tailoredResumes[job.id].optimized_skills?.map((item, index) => (
        <span
          key={index}
          className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs"
        >
          {item}
        </span>
      ))}
    </div>

    <p className="mt-4 font-medium">Optimized Experience Bullets</p>
    <ul className="list-disc list-inside text-slate-300 text-sm mt-2 space-y-1">
      {tailoredResumes[job.id].optimized_experience_bullets?.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>

    <p className="mt-4 font-medium">Projects to Highlight</p>
    <ul className="list-disc list-inside text-slate-300 text-sm mt-2 space-y-1">
      {tailoredResumes[job.id].recommended_projects_to_highlight?.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>

    <p className="mt-4 font-medium">Missing Gaps</p>
    <ul className="list-disc list-inside text-slate-300 text-sm mt-2 space-y-1">
      {tailoredResumes[job.id].missing_gaps?.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>

    <p className="mt-4 text-xs text-slate-400">
      {tailoredResumes[job.id].final_notes}
    </p>
  </div>
)}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}