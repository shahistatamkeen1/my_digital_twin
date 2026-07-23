"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

import SpatialCard from "../components/SpatialCard";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingScreen />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, status } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/twin-hub");
    }
  }, [router, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(email.trim(), password);

      const requestedPath = searchParams.get("next");
      const safePath =
        requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : "/twin-hub";

      router.replace(safePath);
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Login failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-12 text-white sm:px-6">
      <div className="pointer-events-none absolute left-[-140px] top-[-140px] h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-160px] right-[-120px] h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

      <SpatialCard className="relative w-full max-w-md border-slate-700/70 bg-slate-900/80 p-6 sm:p-8">
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
          Secure access
        </p>

        <h1 className="mt-2 text-3xl font-bold">Welcome back</h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Sign in to access your Twin Hub and personal AI workspaces.
        </p>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-300">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">Password</span>

            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-cyan-950/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          New to My Digital Twin?{" "}
          <Link
            href="/register"
            className="font-semibold text-cyan-300 transition hover:text-cyan-200"
          >
            Create an account
          </Link>
        </p>
      </SpatialCard>
    </main>
  );
}

function LoginLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-400" />
    </main>
  );
}
