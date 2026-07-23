"use client";

import { apiFetch } from "@/lib/api";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import AppShell from "@/components/AppShell";

type AdvisorReply = {
  executive_summary: string;
  mission_status: string;
  career_signal: string;
  finance_signal: string;
  health_signal: string;
  learning_signal: string;
  personal_memory_signal: string;
  conflict_resolution: string;
  risk_level: string;
  risks: string[];
  recommended_actions: string[];
  expected_roi: string;
  next_best_action: string;
};

type Message = {
  role: "user" | "assistant";
  content?: string;
  structured?: AdvisorReply;
};

type FocusScores = {
  career_score: number;
  finance_score: number;
  health_score: number;
  learning_score: number;
  overall_score: number;
  highest_roi_focus: string;
};

const initialMessage: Message = {
  role: "assistant",
  content:
    "Hi, I'm your Digital Twin Advisor.\n\nI combine insights from your Career, Finance, Health, Learning, and Personal Memory twins to help you make smarter decisions, prioritize actions, and achieve your goals faster.",
};

const quickPrompts = [
  {
    label: "Become AI Engineer",
    prompt:
      "Create a practical plan to become job-ready for AI Engineer roles using my career, learning, finance, and health data.",
  },
  {
    label: "Weekly Executive Plan",
    prompt:
      "Create my weekly executive plan using my personal memory, career, finance, health, and learning data.",
  },
  {
    label: "Today's Best Action",
    prompt:
      "What is the single best action I should take today based on all my Digital Twin data?",
  },
  {
    label: "Learning Roadmap",
    prompt:
      "Create a learning roadmap for my current goals and explain what I should study first.",
  },
  {
    label: "Biggest Risk",
    prompt:
      "What is my biggest current risk or bottleneck across career, finance, health, and learning?",
  },
  {
    label: "Focus This Week",
    prompt:
      "What should I focus on this week to improve my overall Digital Twin score?",
  },
  {
    label: "Salary Growth Plan",
    prompt:
      "How can I improve my career path, learning plan, and income potential over the next 30 days?",
  },
  {
    label: "Life Strategy",
    prompt:
      "Based on all my Digital Twin data, what should I prioritize this month?",
  },
];

export default function DigitalTwinAdvisorPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusScores, setFocusScores] = useState<FocusScores | null>(null);
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [mounted, setMounted] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const saved = localStorage.getItem("digitalTwinAdvisorHistory");

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      } catch {
        setMessages([initialMessage]);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(
        "digitalTwinAdvisorHistory",
        JSON.stringify(messages)
      );
    }
  }, [messages, mounted]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (customPrompt?: string) => {
    const messageToSend = customPrompt || input;

    if (!messageToSend.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: messageToSend,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/twin-orchestrator/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: messageToSend,
          }),
        }
      );

      const data = await res.json();

      if (data.focus_scores) {
        setFocusScores(data.focus_scores);
      }

      if (data.reply && typeof data.reply === "object") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            structured: data.reply,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply || "I could not generate a response.",
          },
        ]);
      }
    } catch (error) {
      console.error("Digital Twin Advisor error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    localStorage.removeItem("digitalTwinAdvisorHistory");
    setMessages([initialMessage]);
  };

  if (!mounted) {
    return (
  <AppShell>
    <div>
      <p className="text-sm text-cyan-300">Master Digital Twin</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
        Digital Twin Advisor
      </h1>
      <p className="mt-3 text-slate-400">Loading advisor...</p>
    </div>
  </AppShell>
);
  }

  return (
    <AppShell>
      <div>
        <p className="text-sm text-cyan-300">Master Digital Twin</p>

        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
  Digital Twin Advisor
</h1>

        <p className="mt-3 max-w-3xl text-slate-400">
          Unified AI advisor that combines your Career, Finance, Health,
          Learning, and Personal Memory twins into one intelligent decision
          engine.
        </p>

        {focusScores && (
          <section className="mt-8 rounded-2xl bg-slate-900 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
                <p className="text-sm text-cyan-300">Current Mission</p>
                <h2 className="mt-2 text-2xl font-bold">
                  Become Job-Ready AI Engineer
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Your advisor is using all twin signals to help you prioritize
                  the highest-impact next step.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
                <p className="text-sm text-slate-400">Overall Twin Score</p>
                <h2 className="mt-2 text-5xl font-bold text-cyan-400">
                  {focusScores.overall_score}%
                </h2>
              </div>

              <div className="rounded-2xl border border-violet-500/40 bg-violet-500/10 p-6">
                <p className="text-sm text-violet-300">Primary Focus</p>
                <h2 className="mt-2 text-3xl font-bold">
                  {focusScores.highest_roi_focus}
                </h2>
                <p className="mt-3 text-sm text-slate-300">
                  This is your highest ROI area right now.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
              <ScoreCard label="Career" value={focusScores.career_score} />
              <ScoreCard label="Finance" value={focusScores.finance_score} />
              <ScoreCard label="Health" value={focusScores.health_score} />
              <ScoreCard label="Learning" value={focusScores.learning_score} />
              <ScoreCard label="Overall" value={focusScores.overall_score} />
            </div>
          </section>
        )}

        <section className="mt-8">
          <p className="text-sm text-cyan-300">Quick Strategies</p>

          <div className="mt-3 flex flex-wrap gap-3">
            {quickPrompts.map((item) => (
              <button
                key={item.label}
                onClick={() => sendMessage(item.prompt)}
                disabled={loading}
                className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400 hover:text-white disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
          <div className="custom-scrollbar h-[60vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:h-[720px] sm:p-5">
            <div className="space-y-5">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[95%] rounded-2xl p-4 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    <p className="mb-2 text-xs font-semibold opacity-70">
                      {message.role === "user"
                        ? "You"
                        : "Digital Twin Advisor"}
                    </p>

                    {message.structured ? (
                      <AdvisorResponseCards reply={message.structured} />
                    ) : (
                      <div className="prose prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-headings:text-white">
                        <ReactMarkdown>{message.content || ""}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-slate-800 p-4 text-sm text-slate-300">
                    Digital Twin Advisor is analyzing your Digital Twin data...
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          <aside className="hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 xl:block">
            <h2 className="text-xl font-bold">How to use Advisor</h2>

            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-400">
              <p>
                Ask strategy questions that require more than one twin agent.
              </p>

              <div className="rounded-xl bg-slate-800 p-4">
                <p className="text-cyan-300">Good examples</p>
                <ul className="mt-2 list-disc space-y-2 pl-5">
                  <li>What should I focus on this month?</li>
                  <li>How do I become job-ready for AI Engineer roles?</li>
                  <li>What is blocking my progress?</li>
                  <li>How should I balance learning, job search, and health?</li>
                </ul>
              </div>

              <div className="rounded-xl bg-slate-800 p-4">
                <p className="text-violet-300">Best used for</p>
                <ul className="mt-2 list-disc space-y-2 pl-5">
                  <li>Life strategy</li>
                  <li>Career planning</li>
                  <li>Weekly focus</li>
                  <li>Decision support</li>
                  <li>Cross-twin recommendations</li>
                </ul>
              </div>
            </div>
          </aside>
        </section>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your Digital Twin Advisor anything..."
            rows={3}
            className="min-h-[110px] flex-1 rounded-2xl border border-slate-800 bg-slate-900 p-4 outline-none focus:border-cyan-500"
          />

          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className="rounded-2xl bg-cyan-600 px-6 py-3 font-semibold hover:bg-cyan-500 disabled:opacity-50"
          >
            Send
          </button>

          <button
            onClick={clearChat}
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm hover:bg-slate-800"
          >
            Clear
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-800 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-2 text-3xl font-bold text-cyan-400">{value}%</h3>

      <div className="mt-3 h-2 rounded-full bg-slate-700">
        <div
          className="h-2 rounded-full bg-cyan-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function AdvisorResponseCards({ reply }: { reply: AdvisorReply }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
        <p className="text-sm font-semibold text-cyan-300">
          🧠 Executive Summary
        </p>
        <p className="mt-2 text-slate-200">{reply.executive_summary}</p>
      </div>

      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
        <p className="text-sm font-semibold text-blue-300">
          🎯 Mission Status
        </p>
        <p className="mt-2 text-slate-200">{reply.mission_status}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SignalCard title="💼 Career Signal" value={reply.career_signal} />
        <SignalCard title="💰 Finance Signal" value={reply.finance_signal} />
        <SignalCard title="❤️ Health Signal" value={reply.health_signal} />
        <SignalCard title="📚 Learning Signal" value={reply.learning_signal} />
      </div>

      <div className="rounded-xl bg-slate-900 p-4">
        <p className="text-sm font-semibold text-violet-300">
          🧬 Personal Memory Signal
        </p>
        <p className="mt-2 text-slate-300">
          {reply.personal_memory_signal}
        </p>
      </div>

      <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
        <p className="text-sm font-semibold text-orange-300">
          ⚖️ Conflict Resolution
        </p>
        <p className="mt-2 text-slate-200">{reply.conflict_resolution}</p>
      </div>

      <div className="rounded-xl bg-slate-900 p-4">
        <p className="text-sm font-semibold text-yellow-300">
          ⚠️ Risk Level: {reply.risk_level}
        </p>

        <ul className="mt-3 space-y-2">
          {(reply.risks || []).map((risk, index) => (
            <li key={index} className="text-slate-300">
              • {risk}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl bg-slate-900 p-4">
        <p className="text-sm font-semibold text-emerald-300">
          ✅ Recommended Actions
        </p>

        <ul className="mt-3 space-y-2">
          {(reply.recommended_actions || []).map((action, index) => (
            <li key={index} className="text-slate-300">
              • {action}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
        <p className="text-sm font-semibold text-purple-300">
          📈 Expected ROI
        </p>
        <p className="mt-2 text-slate-200">{reply.expected_roi}</p>
      </div>

      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <p className="text-sm font-semibold text-emerald-300">
          🚀 Next Best Action
        </p>
        <p className="mt-2 text-slate-100">{reply.next_best_action}</p>
      </div>
    </div>
  );
}

function SignalCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-900 p-4">
      <p className="text-sm font-semibold text-slate-300">{title}</p>
      <p className="mt-2 text-slate-400">{value}</p>
    </div>
  );
}