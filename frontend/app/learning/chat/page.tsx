"use client";

import { useState } from "react";

type StructuredReply = {
  recommendation: string;
  resources: string[];
  next_actions: string[];
};

type Message = {
  role: "user" | "assistant";
  content?: string;
  structured?: StructuredReply;
};

export default function LearningChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const question = input;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: question,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/learning-chat/structured`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: question,
          }),
        }
      );

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          structured: data.reply,
        },
      ]);
    } catch (error) {
      console.error(error);
      alert("Could not get Learning Twin response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto flex h-[85vh] max-w-6xl flex-col">
        <p className="text-sm text-cyan-300">Learning Twin</p>

        <h1 className="mt-2 text-4xl font-bold">AI Learning Chat</h1>

        <p className="mt-3 text-slate-400">
          Ask about skills, certifications, study plans, learning paths, or what to learn next.
        </p>

        <div className="mt-6 flex-1 overflow-y-auto rounded-2xl bg-slate-900 p-6">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-slate-500">
              Ask your Learning Twin anything...
            </div>
          )}

          <div className="space-y-5">
            {messages.map((message, index) => (
              <div key={index}>
                {message.role === "user" && (
                  <div className="ml-auto max-w-[75%] rounded-xl bg-cyan-600 p-4">
                    <p>{message.content}</p>
                  </div>
                )}

                {message.role === "assistant" && message.structured && (
                  <div className="max-w-[85%] rounded-xl border border-cyan-500/30 bg-slate-950 p-5">
                    <div className="rounded-lg bg-slate-900 p-4">
                      <p className="text-sm font-semibold text-cyan-300">
                        📌 Recommendation
                      </p>
                      <p className="mt-2 text-slate-300">
                        {message.structured.recommendation}
                      </p>
                    </div>

                    <div className="mt-4 rounded-lg bg-slate-900 p-4">
                      <p className="text-sm font-semibold text-violet-300">
                        📚 Resources
                      </p>

                      <ul className="mt-3 space-y-2">
                        {message.structured.resources.map((item, i) => (
                          <li key={i} className="text-slate-300">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 rounded-lg bg-slate-900 p-4">
                      <p className="text-sm font-semibold text-emerald-300">
                        ✅ Next Actions
                      </p>

                      <ul className="mt-3 space-y-2">
                        {message.structured.next_actions.map((item, i) => (
                          <li key={i} className="text-slate-300">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="rounded-xl bg-slate-800 p-4 text-slate-400">
                Learning Twin is thinking...
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your Learning Twin..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="rounded-xl bg-cyan-600 px-6 py-3 hover:bg-cyan-500 disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>
    </main>
  );
}