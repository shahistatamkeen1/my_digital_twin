"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const quickPrompts = [
  {
    label: "Sleep Plan",
    prompt: "Create a simple sleep improvement plan based on my Health Twin data.",
  },
  {
    label: "Wellness Review",
    prompt: "Review my current wellness habits and tell me what I should improve.",
  },
  {
    label: "Hydration Check",
    prompt: "Am I meeting my water intake goal? What should I do next?",
  },
  {
    label: "Workout Plan",
    prompt: "Create a beginner-friendly workout plan based on my fitness level and goals.",
  },
  {
    label: "Weekly Health Plan",
    prompt: "Create a simple weekly wellness plan using my health memory and habits.",
  },
];

export default function HealthChatPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("healthChatHistory");
      if (saved) return JSON.parse(saved);
    }

    return [
      {
        role: "assistant",
        content:
          "Hi, I’m your Health Twin. I can help you improve sleep, hydration, workouts, wellness routines, and daily habits using your Health Memory and habit history.",
      },
    ];
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem("healthChatHistory", JSON.stringify(messages));
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/health-chat/`,
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
      console.error("Health chat error:", error);

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
    localStorage.removeItem("healthChatHistory");

    setMessages([
      {
        role: "assistant",
        content:
          "Hi, I’m your Health Twin. I can help you improve sleep, hydration, workouts, wellness routines, and daily habits using your Health Memory and habit history.",
      },
    ]);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold">Health Twin Chat</h1>

        <p className="mt-2 text-slate-400">
          Ask your AI Health Twin about sleep, hydration, workouts, wellness habits, and routines.
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
                    {message.role === "user" ? "You" : "Health Twin"}
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
                  Health Twin is analyzing your wellness data...
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
            placeholder="Ask your Health Twin anything..."
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
            onClick={clearChat}
            className="rounded-2xl border border-slate-700 px-4 text-sm hover:bg-slate-800"
          >
            Clear
          </button>
        </div>
      </div>
    </main>
  );
}