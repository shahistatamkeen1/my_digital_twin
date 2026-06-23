import PrimaryButton from "../components/PrimaryButton";
import SpatialCard from "../components/SpatialCard";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="absolute h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

      <SpatialCard className="relative w-full max-w-md">
        <h1 className="text-3xl font-bold">Login</h1>

        <p className="mt-3 text-sm text-slate-400">
          Authentication will be added later. For now, continue to the Twin Hub.
        </p>

        <div className="mt-8 space-y-4">
          <input
            placeholder="Email"
            className="w-full rounded-xl border border-white/10 bg-slate-900 p-3 outline-none"
          />

          <input
            placeholder="Password"
            type="password"
            className="w-full rounded-xl border border-white/10 bg-slate-900 p-3 outline-none"
          />

          <PrimaryButton href="/twin-hub">
            Continue to Twin Hub
          </PrimaryButton>
        </div>
      </SpatialCard>
    </main>
  );
}