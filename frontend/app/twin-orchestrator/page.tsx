"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const quickPrompts = [
  {
    label: "Career + Finance Plan",
    prompt:
      "Create a combined career and finance plan for the next 30 days based on my current twin data.",
  },
  {
    label: "Can I Buy a Car?",
    prompt:
      "Can I afford to buy a car while still working toward my career goals?",
  },
  {
    label: "Salary Growth Plan",
    prompt:
      "How can I improve my career path to increase my income and reach my financial goals faster?",
  },
  {
    label: "Life Strategy",
    prompt:
      "Based on my career and finance data, what should I prioritize this month?",
  },
];

export default function TwinOrchestratorPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

 const [messages, setMessages] = useState<Message[]>(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("twinOrchestratorHistory");
    if (saved) return JSON.parse(saved);
  }

  return [
    {
      role: "assistant",
      content:
        "Hi, I’m your Twin Orchestrator. I can combine your Career Twin and Finance Twin data to help you make smarter decisions across work, money, goals, and planning.",
    },
  ];
});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
  localStorage.setItem("twinOrchestratorHistory", JSON.stringify(messages));
}, [messages]);

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
      const res = await fetch(
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

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "I could not generate a response.",
        },
      ]);
    } catch (error) {
      console.error("Twin Orchestrator error:", error);

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

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <p className="text-sm text-cyan-300">Master Digital Twin</p>

        <h1 className="mt-2 text-3xl font-bold">Twin Orchestrator</h1>

        <p className="mt-2 text-slate-400">
          Ask questions that combine Career Twin and Finance Twin intelligence.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
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
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  <p className="mb-2 text-xs font-semibold opacity-70">
                    {message.role === "user" ? "You" : "Twin Orchestrator"}
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
                  Twin Orchestrator is analyzing Career Twin and Finance Twin data...
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
            placeholder="Ask your Twin Orchestrator anything..."
            rows={3}
            className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 p-4 outline-none focus:border-cyan-500"
          />

          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className="rounded-2xl bg-cyan-600 px-6 font-semibold hover:bg-cyan-500 disabled:opacity-50"
          >
            Send
          </button>

          <button
  onClick={() => {
    localStorage.removeItem("twinOrchestratorHistory");
    setMessages([
      {
        role: "assistant",
        content:
          "Hi, I’m your Twin Orchestrator. I can combine your Career Twin and Finance Twin data to help you make smarter decisions across work, money, goals, and planning.",
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