"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import SpatialCard from "../components/SpatialCard";
import { useAuth } from "@/components/auth/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { register, status } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/twin-hub");
    }
  }, [router, status]);

  const passwordRules = useMemo(
    () => ({
      length: password.length >= 8,
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      number: /\d/.test(password),
    }),
    [password]
  );

  const passwordIsValid = Object.values(passwordRules).every(Boolean);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!passwordIsValid) {
      setError("Please meet all password requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await register(fullName.trim(), email.trim(), password);
      router.replace("/twin-hub");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-12 text-white sm:px-6">
      <div className="pointer-events-none absolute left-[-140px] top-[-140px] h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-160px] right-[-120px] h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

      <SpatialCard className="relative w-full max-w-lg border-slate-700/70 bg-slate-900/80 p-6 sm:p-8">
        <Link
          href="/"
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Home
        </Link>

        <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-2xl shadow-lg shadow-cyan-900/30">
          🧬
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Create your private workspace
        </p>

        <h1 className="mt-2 text-3xl font-bold">Create an account</h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Your account will become the owner of your Career, Finance, Health,
          Learning, and shared memory records in the next ownership step.
        </p>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-300">Full name</span>
            <input
              type="text"
              autoComplete="name"
              required
              minLength={2}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your full name"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">Password</span>

            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a strong password"
                className={`${inputClassName.replace("mt-2 ", "")} pr-20`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-3 text-xs font-medium text-slate-400 transition hover:text-white"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <PasswordRule met={passwordRules.length} label="8+ characters" />
            <PasswordRule met={passwordRules.upper} label="Uppercase" />
            <PasswordRule met={passwordRules.lower} label="Lowercase" />
            <PasswordRule met={passwordRules.number} label="Number" />
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">
              Confirm password
            </span>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              className={inputClassName}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-cyan-950/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-cyan-300 transition hover:text-cyan-200"
          >
            Sign in
          </Link>
        </p>
      </SpatialCard>
    </main>
  );
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20";

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-center transition ${
        met
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-slate-700 bg-slate-950/40 text-slate-500"
      }`}
    >
      {met ? "✓" : "○"} {label}
    </div>
  );
}
