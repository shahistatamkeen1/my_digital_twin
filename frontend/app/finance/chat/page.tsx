"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const quickPrompts = [
  {
    label: "Budget Review",
    prompt: "Review my current budget and tell me what I should improve.",
  },
  {
    label: "Savings Plan",
    prompt: "Create a simple savings plan based on my income and expenses.",
  },
  {
    label: "Spending Review",
    prompt: "Analyze my spending categories and point out any concerns.",
  },
  {
    label: "Goal Strategy",
    prompt: "Help me reach my savings goals faster.",
  },
];

export default function FinanceChatPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("financeChatHistory");
    if (saved) return JSON.parse(saved);
  }

  return [
    {
      role: "assistant",
      content:
        "Hi, I’m your Finance Twin. I can help you understand your spending, plan savings, review your budget, and improve your financial habits.",
    },
  ];
});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
  localStorage.setItem("financeChatHistory", JSON.stringify(messages));
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/finance-chat/`,
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
      console.error("Finance chat error:", error);

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
        <h1 className="text-3xl font-bold">Finance Twin Chat</h1>

        <p className="mt-2 text-slate-400">
          Ask your AI Finance Twin about budgeting, expenses, savings, and goals.
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
                    {message.role === "user" ? "You" : "Finance Twin"}
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
                  Finance Twin is analyzing your data...
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
            placeholder="Ask your Finance Twin anything..."
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
    localStorage.removeItem("financeChatHistory");
    setMessages([
      {
        role: "assistant",
        content:
          "Hi, I’m your Finance Twin. I can help you understand your spending, plan savings, review your budget, and improve your financial habits.",
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