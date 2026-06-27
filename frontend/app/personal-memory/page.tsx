"use client";

import { useEffect, useState } from "react";

type PersonalMemory = {
  name: string;
  location: string;
  timezone: string;
  current_status: string;
  long_term_goals: string;
  daily_schedule: string;
  communication_style: string;
  life_priorities: string;
  notes: string;
};

export default function PersonalMemoryPage() {
  const [memory, setMemory] = useState<PersonalMemory>({
    name: "",
    location: "",
    timezone: "",
    current_status: "",
    long_term_goals: "",
    daily_schedule: "",
    communication_style: "",
    life_priorities: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchMemory = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/personal-memory/`
      );

      const data = await res.json();

      setMemory({
        name: data.name || "",
        location: data.location || "",
        timezone: data.timezone || "",
        current_status: data.current_status || "",
        long_term_goals: data.long_term_goals || "",
        daily_schedule: data.daily_schedule || "",
        communication_style: data.communication_style || "",
        life_priorities: data.life_priorities || "",
        notes: data.notes || "",
      });
    } catch (error) {
      console.error("Could not load personal memory:", error);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, []);

  const updateField = (field: keyof PersonalMemory, value: string) => {
    setMemory((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveMemory = async () => {
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/personal-memory/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(memory),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to save personal memory");
      }

      setSuccess(true);
      fetchMemory();

      setTimeout(() => {
        setSuccess(false);
      }, 2500);
    } catch (error) {
      console.error("Could not save personal memory:", error);
      alert("Could not save Personal Memory.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">Personal Memory</h1>

      <p className="mt-2 text-slate-400">
        This is the shared identity layer used by Career Twin, Finance Twin,
        Health Twin, and the Twin Orchestrator.
      </p>

      {success && (
        <div className="mt-5 rounded-lg border border-green-600 bg-green-900/20 p-3 text-green-400">
          ✓ Personal Memory saved successfully.
        </div>
      )}

      <div className="mt-8 rounded-xl bg-slate-900 p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <InputField
            label="Name"
            value={memory.name}
            onChange={(value) => updateField("name", value)}
            placeholder="Shahista"
          />

          <InputField
            label="Location"
            value={memory.location}
            onChange={(value) => updateField("location", value)}
            placeholder="Chicago, IL"
          />

          <InputField
            label="Timezone"
            value={memory.timezone}
            onChange={(value) => updateField("timezone", value)}
            placeholder="Central Time"
          />

          <InputField
            label="Current Status"
            value={memory.current_status}
            onChange={(value) => updateField("current_status", value)}
            placeholder="Graduated, job searching, working full-time..."
          />

          <TextAreaField
            label="Long-Term Goals"
            value={memory.long_term_goals}
            onChange={(value) => updateField("long_term_goals", value)}
            placeholder="Become an AI Engineer, build financial stability, improve health..."
          />

          <TextAreaField
            label="Daily Schedule"
            value={memory.daily_schedule}
            onChange={(value) => updateField("daily_schedule", value)}
            placeholder="Work hours, study hours, workout time, sleep schedule..."
          />

          <TextAreaField
            label="Communication Style"
            value={memory.communication_style}
            onChange={(value) => updateField("communication_style", value)}
            placeholder="Simple, direct, step-by-step, professional..."
          />

          <TextAreaField
            label="Life Priorities"
            value={memory.life_priorities}
            onChange={(value) => updateField("life_priorities", value)}
            placeholder="Career, finances, health, learning, family..."
          />

          <div className="md:col-span-2">
            <TextAreaField
              label="Notes"
              value={memory.notes}
              onChange={(value) => updateField("notes", value)}
              placeholder="Anything your Digital Twin should remember..."
            />
          </div>
        </div>

        <button
          onClick={saveMemory}
          disabled={saving}
          className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Personal Memory"}
        </button>
      </div>
    </main>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-sm text-slate-400">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-sm text-slate-400">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none"
      />
    </div>
  );
}