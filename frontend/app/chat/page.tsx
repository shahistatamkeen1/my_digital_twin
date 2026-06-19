"use client";

import { useState } from "react";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");

  const sendMessage = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    setReply(data.reply);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold">Career Twin Chat</h1>

      <div className="mt-8 bg-slate-900 p-6 rounded-xl">
        <textarea
          className="w-full bg-slate-800 p-4 rounded-lg"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask Career Twin anything..."
        />

        <button
          onClick={sendMessage}
          className="mt-4 bg-indigo-600 px-4 py-2 rounded-lg"
        >
          Ask Career Twin
        </button>
      </div>

      {reply && (
        <div className="mt-8 bg-slate-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold">Career Twin Reply</h2>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-300">
            {reply}
          </pre>
        </div>
      )}
    </main>
  );
}