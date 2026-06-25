"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";


type Message = {
  role: "user" | "assistant";
  content: string;
};

const quickPrompts = [
  {
    label: "Weekly Plan",
    prompt:
      "Create a weekly action plan based on my current roadmap and applications.",
  },
  {
    label: "Resume Review",
    prompt:
      "Review my current career progress and tell me how I should improve my resume.",
  },
  {
    label: "Skill Gap",
    prompt:
      "What are my biggest skill gaps based on my career goal and current applications?",
  },
  {
    label: "Interview Prep",
    prompt:
      "What interview topics should I practice this week based on my target role?",
  },
  {
    label: "Job Strategy",
    prompt:
      "What job search strategy should I follow based on my saved and applied jobs?",
  },
];

type TwinRecommendation = {
  title: string;
  recommended_action: string;
  reason: string;
  priority: string;
  suggested_prompt: string;
};

export default function CareerChatPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [recommendation, setRecommendation] =
  useState<TwinRecommendation | null>(null);

  const [messages, setMessages] = useState<Message[]>(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("careerChatHistory");
    if (saved) return JSON.parse(saved);
  }

  return [
    {
      role: "assistant",
      content:
        "Hi Shahista, I’m your Career Twin. I can help you plan your week, improve your resume, prepare for interviews, analyze skill gaps, and guide your job search using your saved career memory and applications.",
    },
  ];
});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
  localStorage.setItem("careerChatHistory", JSON.stringify(messages));
}, [messages]);

  useEffect(() => {
  fetchRecommendation();
}, []);

  const sendMessage = async (customPrompt?: string) => {
    const messageToSend = customPrompt || input;

    if (!messageToSend.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: messageToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageToSend,
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply || "I could not generate a response.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Career chat error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Something went wrong while contacting your Career Twin. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendation = async () => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/twin-recommendation/`
    );

    const data = await res.json();

    if (!data.error) {
      setRecommendation(data);
    }
  } catch (error) {
    console.error("Could not load recommendation", error);
  }
};

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold">Career Twin Chat</h1>

        <p className="mt-2 text-slate-400">
          Talk to your personalized AI Career Twin powered by your memory,
          roadmap, and applications.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {quickPrompts.map((item) => (
            <button
              key={item.label}
              onClick={() => sendMessage(item.prompt)}
              disabled={loading}
              className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:border-indigo-400 hover:text-white disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>

        {recommendation && (
  <div className="mt-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-indigo-300">Today&apos;s Twin Recommendation</p>

        <h2 className="mt-2 text-xl font-semibold">
          {recommendation.title}
        </h2>

        <p className="mt-3 text-slate-300">
          {recommendation.recommended_action}
        </p>

        <p className="mt-3 text-sm text-slate-400">
          {recommendation.reason}
        </p>
      </div>

      <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs">
        {recommendation.priority}
      </span>
    </div>

    <button
      onClick={() => sendMessage(recommendation.suggested_prompt)}
      disabled={loading}
      className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
    >
      Ask Career Twin
    </button>
  </div>
)}

        <div className="mt-8 h-[560px] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="space-y-5">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-sm leading-6 whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  <p className="mb-2 text-xs font-semibold opacity-70">
                    {message.role === "user" ? "You" : "Career Twin"}
                  </p>

                  <div className="prose prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-headings:text-white">
  <ReactMarkdown>{message.content}</ReactMarkdown>
</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-800 p-4 text-sm text-slate-300">
                  Career Twin is thinking...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your Career Twin anything..."
            rows={3}
            className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 p-4 outline-none focus:border-indigo-500"
          />

          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className="rounded-2xl bg-indigo-600 px-6 font-semibold hover:bg-indigo-500 disabled:opacity-50"
          >
            Send
          </button>

          <button
  onClick={() => {
    localStorage.removeItem("careerChatHistory");
    setMessages([
      {
        role: "assistant",
        content:
          "Hi Shahista, I’m your Career Twin. I can help you plan your week, improve your resume, prepare for interviews, analyze skill gaps, and guide your job search using your saved career memory and applications.",
      },
    ]);
  }}
  className="rounded-2xl border border-slate-700 px-4 text-sm hover:bg-slate-800"
>
  Clear
</button>
        </div>
      </div>
    </main>
  );
}