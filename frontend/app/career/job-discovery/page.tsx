"use client";

import { apiFetch } from "@/lib/api";

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

const stripHtml = (value: string) => {
  return value.replace(/<[^>]*>/g, "");
};

const formatSalary = (value?: number) => {
  if (typeof value !== "number") {
    return "?";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function JobDiscoveryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [memory, setMemory] =
    useState<CareerMemory | null>(null);

  const [role, setRole] =
    useState("Software Engineer");

  const [location, setLocation] =
    useState("remote");

  const [loading, setLoading] =
    useState(false);

  const [savedJobs, setSavedJobs] = useState<
    Record<string, number>
  >({});

  const [appliedJobs, setAppliedJobs] =
    useState<string[]>([]);

  const [resumeText, setResumeText] =
    useState("");

  const [matchResults, setMatchResults] = useState<
    Record<string, MatchResult>
  >({});

  const [analyzingJobId, setAnalyzingJobId] =
    useState<string | null>(null);

  const [atsResults, setAtsResults] = useState<
    Record<string, ATSResult>
  >({});

  const [interviewResults, setInterviewResults] =
    useState<Record<string, InterviewResult>>({});

  const [
    generatingInterviewJobId,
    setGeneratingInterviewJobId,
  ] = useState<string | null>(null);

  const [
    generatingAtsJobId,
    setGeneratingAtsJobId,
  ] = useState<string | null>(null);

  const [coverLetters, setCoverLetters] =
    useState<Record<string, CoverLetterResult>>({});

  const [
    generatingCoverLetterJobId,
    setGeneratingCoverLetterJobId,
  ] = useState<string | null>(null);

  const [autofillResults, setAutofillResults] =
    useState<Record<string, AutofillResult>>({});

  const [
    generatingAutofillJobId,
    setGeneratingAutofillJobId,
  ] = useState<string | null>(null);

  const [tailoredResumes, setTailoredResumes] =
    useState<Record<string, TailoredResumeResult>>({});

  const [tailoringJobId, setTailoringJobId] =
    useState<string | null>(null);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL;

  const normalizeLocation = (value: string) => {
    const clean = value.trim().toLowerCase();

    if (!clean) {
      return "remote";
    }

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

  const ensureApiUrl = () => {
    if (!apiUrl) {
      alert(
        "NEXT_PUBLIC_API_URL is not configured."
      );

      return false;
    }

    return true;
  };

  const copyText = async (
    text: string,
    label: string
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied.`);
    } catch (error) {
      console.error(
        `Could not copy ${label}:`,
        error
      );

      alert(`Could not copy ${label}.`);
    }
  };

  const fetchMemory = async () => {
    if (!apiUrl) {
      return;
    }

    try {
      const response = await apiFetch(
        `${apiUrl}/api/memory/`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data) {
        setMemory(data);

        if (data.target_role) {
          setRole(data.target_role);
        }

        const memoryText = `
          ${data.career_goal || ""}
          ${data.target_role || ""}
          ${data.current_skills || ""}
          ${data.skills_to_learn || ""}
          ${data.notes || ""}
        `.toLowerCase();

        if (memoryText.includes("chicago")) {
          setLocation("Chicago");
        } else {
          setLocation("remote");
        }
      }
    } catch (error) {
      console.log(
        "No career memory found:",
        error
      );
    }
  };

  useEffect(() => {
    fetchMemory();

    const savedResume =
      localStorage.getItem("resumeText");

    if (savedResume) {
      setResumeText(savedResume);
    }
  }, []);

  const searchJobs = async () => {
    if (!ensureApiUrl()) {
      return;
    }

    if (!role.trim()) {
      alert("Please enter a role.");
      return;
    }

    setLoading(true);

    try {
      const cleanLocation =
        normalizeLocation(location);

      const requestUrl =
        `${apiUrl}/api/jobs/search` +
        `?role=${encodeURIComponent(
          role.trim()
        )}` +
        `&location=${encodeURIComponent(
          cleanLocation
        )}` +
        `&country=us`;

      const response = await apiFetch(requestUrl, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Jobs API failed with status ${response.status}.`
        );
      }

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setJobs([]);
        return;
      }

      if (
        !Array.isArray(data.jobs) ||
        data.jobs.length === 0
      ) {
        alert(
          "No jobs found for this search."
        );

        setJobs([]);
        return;
      }

      setLocation(cleanLocation);
      setJobs(data.jobs);
    } catch (error) {
      console.error(
        "Job fetch error:",
        error
      );

      alert("Could not fetch real jobs.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeJobMatch = async (
    job: Job
  ) => {
    if (!ensureApiUrl()) {
      return;
    }

    if (!resumeText) {
      alert(
        "Please upload your resume first in Resume Center."
      );

      return;
    }

    setAnalyzingJobId(job.id);

    try {
      const response = await apiFetch(
        `${apiUrl}/api/job-match/`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            resume_text: resumeText,
            job_description:
              job.description,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Match analysis failed with status ${response.status}.`
        );
      }

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setMatchResults((previous) => ({
        ...previous,
        [job.id]: data,
      }));
    } catch (error) {
      console.error(
        "Analyze match error:",
        error
      );

      alert(
        "Could not analyze job match."
      );
    } finally {
      setAnalyzingJobId(null);
    }
  };

  const saveJob = async (job: Job) => {
    if (!ensureApiUrl()) {
      return;
    }

    const match =
      matchResults[job.id];

    const ats =
      atsResults[job.id];

    const aiNotes = `
Saved from Real Job Discovery.

Source: ${job.source || "Unknown"}
Apply link: ${job.url}

AI Match Analysis:
Match Score: ${
      match?.match_score ?? "Not analyzed"
    }%
Missing Skills: ${
      match?.missing_skills?.join(", ") ||
      "Not analyzed"
    }
Keywords to Add: ${
      match?.keywords_to_add?.join(", ") ||
      "Not analyzed"
    }
Recommendation: ${
      match?.recommendation ||
      "Not analyzed"
    }

ATS Resume Optimization:
ATS Score: ${
      ats?.ats_score ?? "Not generated"
    }%
Missing Keywords: ${
      ats?.missing_keywords?.join(", ") ||
      "Not generated"
    }
Keywords to Add: ${
      ats?.keywords_to_add?.join(", ") ||
      "Not generated"
    }
Optimized Summary: ${
      ats?.optimized_summary ||
      "Not generated"
    }

Optimized Bullets:
${
  ats?.optimized_bullets
    ?.map((bullet) => `- ${bullet}`)
    .join("\n") || "Not generated"
}
`;

    try {
      const response = await apiFetch(
        `${apiUrl}/api/applications/`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            company: job.company,
            role: job.role,
            location: job.location,
            status: "Saved",
            date_applied: "",
            notes: aiNotes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        if (
          data.existing_application?.id
        ) {
          setSavedJobs((previous) => ({
            ...previous,
            [job.id]:
              data.existing_application.id,
          }));
        }

        alert(
          data.error ||
            "Could not save job."
        );

        return;
      }

      setSavedJobs((previous) => ({
        ...previous,
        [job.id]: data.id,
      }));
    } catch (error) {
      console.error(
        "Save job error:",
        error
      );

      alert("Could not save job.");
    }
  };

  const markApplied = async (
    job: Job
  ) => {
    if (!ensureApiUrl()) {
      return;
    }

    const applicationId =
      savedJobs[job.id];

    if (!applicationId) {
      alert(
        "Please save this job first."
      );

      return;
    }

    try {
      const response = await apiFetch(
        `${apiUrl}/api/applications/${applicationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status: "Applied",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Could not mark as applied: ${response.status}`
        );
      }

      setAppliedJobs((previous) =>
        previous.includes(job.id)
          ? previous
          : [...previous, job.id]
      );
    } catch (error) {
      console.error(
        "Mark applied error:",
        error
      );

      alert(
        "Could not mark as applied."
      );
    }
  };

  const tailorResumeForJob = async (
    job: Job
  ) => {
    if (!ensureApiUrl()) {
      return;
    }

    if (!resumeText) {
      alert(
        "Please upload your resume first in Resume Center."
      );

      return;
    }

    setTailoringJobId(job.id);

    try {
      const response = await apiFetch(
        `${apiUrl}/api/resume-tailor/`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            resume_text: resumeText,
            job_description:
              job.description,
            company: job.company,
            role: job.role,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Resume tailoring failed with status ${response.status}.`
        );
      }

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setTailoredResumes(
        (previous) => ({
          ...previous,
          [job.id]: data,
        })
      );
    } catch (error) {
      console.error(
        "Resume tailoring error:",
        error
      );

      alert(
        "Could not tailor resume."
      );
    } finally {
      setTailoringJobId(null);
    }
  };

  const generateATSResume = async (
    job: Job
  ) => {
    if (!ensureApiUrl()) {
      return;
    }

    if (!resumeText) {
      alert(
        "Please upload your resume first in Resume Center."
      );

      return;
    }

    setGeneratingAtsJobId(job.id);

    try {
      const response = await apiFetch(
        `${apiUrl}/api/ats-resume/`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            resume_text: resumeText,
            job_description:
              job.description,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `ATS generation failed with status ${response.status}.`
        );
      }

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setAtsResults((previous) => ({
        ...previous,
        [job.id]: data,
      }));

      await tailorResumeForJob(job);
    } catch (error) {
      console.error(
        "ATS resume error:",
        error
      );

      alert(
        "Could not generate ATS resume."
      );
    } finally {
      setGeneratingAtsJobId(null);
    }
  };

  const generateInterviewPrep =
    async (job: Job) => {
      if (!ensureApiUrl()) {
        return;
      }

      setGeneratingInterviewJobId(
        job.id
      );

      try {
        const response = await apiFetch(
          `${apiUrl}/api/interview/`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              role: job.role,
              company: job.company,
              job_description:
                job.description,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Interview generation failed with status ${response.status}.`
          );
        }

        const data =
          await response.json();

        if (data.error) {
          alert(data.error);
          return;
        }

        setInterviewResults(
          (previous) => ({
            ...previous,
            [job.id]: data,
          })
        );
      } catch (error) {
        console.error(
          "Interview preparation error:",
          error
        );

        alert(
          "Failed to generate interview preparation."
        );
      } finally {
        setGeneratingInterviewJobId(
          null
        );
      }
    };

  const generateCoverLetterForJob =
    async (job: Job) => {
      if (!ensureApiUrl()) {
        return;
      }

      if (!resumeText) {
        alert(
          "Please upload your resume first in Resume Center."
        );

        return;
      }

      setGeneratingCoverLetterJobId(
        job.id
      );

      try {
        const response = await apiFetch(
          `${apiUrl}/api/cover-letter/`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              resume_text: resumeText,
              company: job.company,
              role: job.role,
              job_description:
                job.description,
              career_goal:
                memory?.career_goal ||
                "",
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Cover letter generation failed with status ${response.status}.`
          );
        }

        const data =
          await response.json();

        if (data.error) {
          alert(data.error);
          return;
        }

        setCoverLetters(
          (previous) => ({
            ...previous,
            [job.id]: data,
          })
        );
      } catch (error) {
        console.error(
          "Cover letter error:",
          error
        );

        alert(
          "Could not generate cover letter."
        );
      } finally {
        setGeneratingCoverLetterJobId(
          null
        );
      }
    };

  const generateAutofillAnswers =
    async (job: Job) => {
      if (!ensureApiUrl()) {
        return;
      }

      if (!resumeText) {
        alert(
          "Please upload your resume first in Resume Center."
        );

        return;
      }

      setGeneratingAutofillJobId(
        job.id
      );

      try {
        const response = await apiFetch(
          `${apiUrl}/api/autofill/`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              resume_text: resumeText,
              company: job.company,
              role: job.role,
              job_description:
                job.description,
              career_goal:
                memory?.career_goal ||
                "",
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Autofill generation failed with status ${response.status}.`
          );
        }

        const data =
          await response.json();

        if (data.error) {
          alert(data.error);
          return;
        }

        setAutofillResults(
          (previous) => ({
            ...previous,
            [job.id]: data,
          })
        );
      } catch (error) {
        console.error(
          "Autofill error:",
          error
        );

        alert(
          "Could not generate autofill answers."
        );
      } finally {
        setGeneratingAutofillJobId(
          null
        );
      }
    };

  return (
    <>
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Real Job Discovery
        </h1>

        <p className="mt-2 max-w-3xl text-slate-400">
          Search real job postings using your Career Memory
          and analyze your fit with AI.
        </p>
      </header>

      {memory && (
        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">
            Personalization Source
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-lg bg-slate-800 p-4">
              <p className="text-xs text-slate-500">
                Target Role
              </p>

              <p className="mt-2 break-words font-medium text-white">
                {memory.target_role || "-"}
              </p>
            </div>

            <div className="rounded-lg bg-slate-800 p-4 lg:col-span-2">
              <p className="text-xs text-slate-500">
                Notes
              </p>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                {memory.notes || "-"}
              </p>
            </div>

            <div className="rounded-lg bg-slate-800 p-4 lg:col-span-3">
              <p className="text-xs text-slate-500">
                Resume Status
              </p>

              <p
                className={`mt-2 font-medium ${
                  resumeText
                    ? "text-emerald-300"
                    : "text-yellow-300"
                }`}
              >
                {resumeText
                  ? "Resume loaded"
                  : "No resume uploaded"}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <h2 className="text-xl font-semibold">
          Search Jobs
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <input
            value={role}
            onChange={(event) =>
              setRole(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                searchJobs();
              }
            }}
            placeholder="AI Engineer"
            aria-label="Job role"
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

          <input
            value={location}
            onChange={(event) =>
              setLocation(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                searchJobs();
              }
            }}
            placeholder="Chicago or remote"
            aria-label="Job location"
            className="w-full rounded-lg bg-slate-800 p-3.5 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

          <button
            type="button"
            onClick={searchJobs}
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-medium transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
          >
            {loading
              ? "Searching..."
              : "Search Real Jobs"}
          </button>
        </div>
      </section>

      {jobs.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-700 bg-slate-900 p-6 text-center sm:p-8">
          <h2 className="text-lg font-semibold text-white">
            No jobs loaded yet
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Enter a role and location, then select Search
            Real Jobs to fetch current listings.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 2xl:grid-cols-2">
          {jobs.map((job) => {
            const cleanDescription =
              stripHtml(
                job.description || ""
              );

            return (
              <article
                key={job.id}
                className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-semibold">
                      {job.role}
                    </h2>

                    <p className="mt-1 break-words text-slate-400">
                      {job.company}
                    </p>

                    <p className="mt-1 break-words text-sm text-slate-500">
                      {job.location ||
                        "Location not provided"}
                    </p>
                  </div>

                  <span className="w-fit shrink-0 rounded-full bg-indigo-500/20 px-3 py-1 text-xs text-indigo-300">
                    {job.source || "Job"}
                  </span>
                </div>

                <p className="mt-5 break-words text-sm leading-6 text-slate-300">
                  {cleanDescription
                    ? `${cleanDescription.slice(
                        0,
                        350
                      )}${
                        cleanDescription.length >
                        350
                          ? "..."
                          : ""
                      }`
                    : "No description available."}
                </p>

                {(job.salary_min ||
                  job.salary_max) && (
                  <p className="mt-4 text-sm text-green-400">
                    Salary:{" "}
                    {formatSalary(
                      job.salary_min
                    )}{" "}
                    –{" "}
                    {formatSalary(
                      job.salary_max
                    )}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full rounded-lg bg-slate-700 px-4 py-2 text-center transition hover:bg-slate-600"
                  >
                    View Job
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      analyzeJobMatch(job)
                    }
                    disabled={
                      analyzingJobId ===
                      job.id
                    }
                    className="w-full rounded-lg bg-purple-600 px-4 py-2 transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {analyzingJobId ===
                    job.id
                      ? "Analyzing..."
                      : "Analyze Match"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      generateATSResume(job)
                    }
                    disabled={
                      generatingAtsJobId ===
                        job.id ||
                      tailoringJobId ===
                        job.id
                    }
                    className="w-full rounded-lg bg-cyan-600 px-4 py-2 transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generatingAtsJobId ===
                    job.id
                      ? "Generating..."
                      : tailoringJobId ===
                        job.id
                      ? "Tailoring..."
                      : "ATS Optimizer"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      generateInterviewPrep(
                        job
                      )
                    }
                    disabled={
                      generatingInterviewJobId ===
                      job.id
                    }
                    className="w-full rounded-lg bg-violet-600 px-4 py-2 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generatingInterviewJobId ===
                    job.id
                      ? "Generating..."
                      : "Prepare Interview"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      generateCoverLetterForJob(
                        job
                      )
                    }
                    disabled={
                      generatingCoverLetterJobId ===
                      job.id
                    }
                    className="w-full rounded-lg bg-pink-600 px-4 py-2 transition hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generatingCoverLetterJobId ===
                    job.id
                      ? "Generating..."
                      : "Generate Cover Letter"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      generateAutofillAnswers(
                        job
                      )
                    }
                    disabled={
                      generatingAutofillJobId ===
                      job.id
                    }
                    className="w-full rounded-lg bg-orange-600 px-4 py-2 transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generatingAutofillJobId ===
                    job.id
                      ? "Generating..."
                      : "Autofill Answers"}
                  </button>

                  {!savedJobs[job.id] ? (
                    <button
                      type="button"
                      onClick={() =>
                        saveJob(job)
                      }
                      className="w-full rounded-lg bg-indigo-600 px-4 py-2 transition hover:bg-indigo-500"
                    >
                      Save to Applications
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-lg bg-slate-700 px-4 py-2 text-slate-300"
                    >
                      Saved
                    </button>
                  )}

                  {savedJobs[job.id] && (
                    <button
                      type="button"
                      onClick={() =>
                        markApplied(job)
                      }
                      disabled={appliedJobs.includes(
                        job.id
                      )}
                      className="w-full rounded-lg bg-green-600 px-4 py-2 transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {appliedJobs.includes(
                        job.id
                      )
                        ? "Applied"
                        : "Mark as Applied"}
                    </button>
                  )}
                </div>

                {matchResults[job.id] && (
                  <section className="mt-5 min-w-0 rounded-lg bg-slate-800 p-4 sm:p-5">
                    <h3 className="font-semibold">
                      AI Match Analysis
                    </h3>

                    <p className="mt-3 text-2xl font-bold text-indigo-400 sm:text-3xl">
                      {
                        matchResults[job.id]
                          .match_score
                      }
                      %
                    </p>

                    <p className="mt-4 font-medium">
                      Missing Skills
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {matchResults[
                        job.id
                      ].missing_skills?.map(
                        (skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="break-words rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-300"
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>

                    <p className="mt-4 font-medium">
                      Keywords to Add
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {matchResults[
                        job.id
                      ].keywords_to_add?.map(
                        (
                          keyword,
                          index
                        ) => (
                          <span
                            key={`${keyword}-${index}`}
                            className="break-words rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300"
                          >
                            {keyword}
                          </span>
                        )
                      )}
                    </div>

                    <p className="mt-4 font-medium">
                      Recommendation
                    </p>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                      {
                        matchResults[job.id]
                          .recommendation
                      }
                    </p>
                  </section>
                )}

                {atsResults[job.id] && (
                  <section className="mt-5 min-w-0 rounded-lg bg-slate-800 p-4 sm:p-5">
                    <h3 className="font-semibold">
                      ATS Resume Optimization
                    </h3>

                    <p className="mt-3 text-2xl font-bold text-cyan-400 sm:text-3xl">
                      {
                        atsResults[job.id]
                          .ats_score
                      }
                      %
                    </p>

                    <p className="mt-4 font-medium">
                      Missing Keywords
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {atsResults[
                        job.id
                      ].missing_keywords?.map(
                        (
                          keyword,
                          index
                        ) => (
                          <span
                            key={`${keyword}-${index}`}
                            className="break-words rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-300"
                          >
                            {keyword}
                          </span>
                        )
                      )}
                    </div>

                    <p className="mt-4 font-medium">
                      Keywords to Add
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {atsResults[
                        job.id
                      ].keywords_to_add?.map(
                        (
                          keyword,
                          index
                        ) => (
                          <span
                            key={`${keyword}-${index}`}
                            className="break-words rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300"
                          >
                            {keyword}
                          </span>
                        )
                      )}
                    </div>

                    <p className="mt-4 font-medium">
                      Optimized Summary
                    </p>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                      {
                        atsResults[job.id]
                          .optimized_summary
                      }
                    </p>

                    <p className="mt-4 font-medium">
                      Optimized Resume Bullets
                    </p>

                    <ul className="mt-2 list-disc space-y-2 break-words pl-5 text-sm leading-6 text-slate-300">
                      {atsResults[
                        job.id
                      ].optimized_bullets?.map(
                        (bullet, index) => (
                          <li
                            key={`${bullet}-${index}`}
                          >
                            {bullet}
                          </li>
                        )
                      )}
                    </ul>

                    {atsResults[job.id]
                      .note && (
                      <p className="mt-4 whitespace-pre-wrap break-words text-xs leading-5 text-slate-400">
                        {
                          atsResults[job.id]
                            .note
                        }
                      </p>
                    )}
                  </section>
                )}

                {interviewResults[
                  job.id
                ] && (
                  <section className="mt-5 min-w-0 rounded-lg bg-slate-800 p-4 sm:p-5">
                    <h3 className="text-xl font-semibold">
                      Interview Preparation
                    </h3>

                    <div className="mt-4">
                      <p className="text-slate-400">
                        Readiness Score
                      </p>

                      <p className="text-3xl font-bold text-purple-400 sm:text-4xl">
                        {
                          interviewResults[
                            job.id
                          ].readiness_score
                        }
                        %
                      </p>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-semibold">
                        Technical Questions
                      </h4>

                      <ul className="mt-2 list-disc space-y-2 break-words pl-5 text-sm leading-6 text-slate-300">
                        {interviewResults[
                          job.id
                        ].technical_questions?.map(
                          (
                            question,
                            index
                          ) => (
                            <li
                              key={`${question}-${index}`}
                            >
                              {question}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-semibold">
                        Behavioral Questions
                      </h4>

                      <ul className="mt-2 list-disc space-y-2 break-words pl-5 text-sm leading-6 text-slate-300">
                        {interviewResults[
                          job.id
                        ].behavioral_questions?.map(
                          (
                            question,
                            index
                          ) => (
                            <li
                              key={`${question}-${index}`}
                            >
                              {question}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-semibold">
                        System Design Questions
                      </h4>

                      <ul className="mt-2 list-disc space-y-2 break-words pl-5 text-sm leading-6 text-slate-300">
                        {interviewResults[
                          job.id
                        ].system_design_questions?.map(
                          (
                            question,
                            index
                          ) => (
                            <li
                              key={`${question}-${index}`}
                            >
                              {question}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    {interviewResults[
                      job.id
                    ].sample_answers?.length >
                      0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold">
                          Sample Answers
                        </h4>

                        <div className="mt-3 space-y-3">
                          {interviewResults[
                            job.id
                          ].sample_answers.map(
                            (
                              item,
                              index
                            ) => (
                              <div
                                key={`${item.question}-${index}`}
                                className="min-w-0 rounded-lg bg-slate-900 p-4"
                              >
                                <p className="break-words font-medium text-purple-300">
                                  {
                                    item.question
                                  }
                                </p>

                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                                  {item.answer}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {coverLetters[job.id] && (
                  <section className="mt-5 min-w-0 rounded-lg bg-slate-800 p-4 sm:p-5">
                    <h3 className="text-xl font-semibold">
                      Generated Cover Letter
                    </h3>

                    <pre className="mt-4 max-h-96 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-900 p-4 font-sans text-sm leading-6 text-slate-300">
                      {
                        coverLetters[job.id]
                          .cover_letter
                      }
                    </pre>

                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          coverLetters[
                            job.id
                          ].cover_letter,
                          "Cover letter"
                        )
                      }
                      className="mt-4 w-full rounded-lg bg-pink-600 px-4 py-2 transition hover:bg-pink-500 sm:w-auto"
                    >
                      Copy Cover Letter
                    </button>
                  </section>
                )}

                {autofillResults[
                  job.id
                ] && (
                  <section className="mt-5 min-w-0 rounded-lg bg-slate-800 p-4 sm:p-5">
                    <h3 className="text-xl font-semibold">
                      Application Autofill
                      Answers
                    </h3>

                    {Object.entries(
                      autofillResults[
                        job.id
                      ]
                    ).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="mt-4 min-w-0 rounded-lg bg-slate-900 p-4"
                        >
                          <p className="break-words font-medium capitalize text-orange-300">
                            {key.replaceAll(
                              "_",
                              " "
                            )}
                          </p>

                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                            {String(value)}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                String(
                                  value
                                ),
                                key.replaceAll(
                                  "_",
                                  " "
                                )
                              )
                            }
                            className="mt-3 w-full rounded bg-slate-700 px-3 py-2 text-sm transition hover:bg-slate-600 sm:w-auto"
                          >
                            Copy
                          </button>
                        </div>
                      )
                    )}
                  </section>
                )}

                {tailoredResumes[
                  job.id
                ] && (
                  <section className="mt-5 min-w-0 rounded-lg bg-slate-800 p-4 sm:p-5">
                    <h3 className="text-xl font-semibold">
                      Resume Tailoring
                      Suggestions
                    </h3>

                    <p className="mt-3 text-2xl font-bold text-emerald-400 sm:text-3xl">
                      {
                        tailoredResumes[
                          job.id
                        ]
                          .tailored_resume_score
                      }
                      %
                    </p>

                    <p className="mt-4 font-medium">
                      Optimized Summary
                    </p>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                      {
                        tailoredResumes[
                          job.id
                        ].optimized_summary
                      }
                    </p>

                    <p className="mt-4 font-medium">
                      Keywords Added
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {tailoredResumes[
                        job.id
                      ].keywords_added?.map(
                        (item, index) => (
                          <span
                            key={`${item}-${index}`}
                            className="break-words rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300"
                          >
                            {item}
                          </span>
                        )
                      )}
                    </div>

                    <p className="mt-4 font-medium">
                      Optimized Skills
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {tailoredResumes[
                        job.id
                      ].optimized_skills?.map(
                        (item, index) => (
                          <span
                            key={`${item}-${index}`}
                            className="break-words rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-300"
                          >
                            {item}
                          </span>
                        )
                      )}
                    </div>

                    <p className="mt-4 font-medium">
                      Optimized Experience
                      Bullets
                    </p>

                    <ul className="mt-2 list-disc space-y-2 break-words pl-5 text-sm leading-6 text-slate-300">
                      {tailoredResumes[
                        job.id
                      ].optimized_experience_bullets?.map(
                        (item, index) => (
                          <li
                            key={`${item}-${index}`}
                          >
                            {item}
                          </li>
                        )
                      )}
                    </ul>

                    <p className="mt-4 font-medium">
                      Projects to Highlight
                    </p>

                    <ul className="mt-2 list-disc space-y-2 break-words pl-5 text-sm leading-6 text-slate-300">
                      {tailoredResumes[
                        job.id
                      ].recommended_projects_to_highlight?.map(
                        (item, index) => (
                          <li
                            key={`${item}-${index}`}
                          >
                            {item}
                          </li>
                        )
                      )}
                    </ul>

                    <p className="mt-4 font-medium">
                      Missing Gaps
                    </p>

                    <ul className="mt-2 list-disc space-y-2 break-words pl-5 text-sm leading-6 text-slate-300">
                      {tailoredResumes[
                        job.id
                      ].missing_gaps?.map(
                        (item, index) => (
                          <li
                            key={`${item}-${index}`}
                          >
                            {item}
                          </li>
                        )
                      )}
                    </ul>

                    {tailoredResumes[
                      job.id
                    ].final_notes && (
                      <p className="mt-4 whitespace-pre-wrap break-words text-xs leading-5 text-slate-400">
                        {
                          tailoredResumes[
                            job.id
                          ].final_notes
                        }
                      </p>
                    )}
                  </section>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}