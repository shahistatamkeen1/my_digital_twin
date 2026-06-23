import SpatialCard from "../components/SpatialCard";

export default function HealthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-8 text-white">
      <SpatialCard className="max-w-xl">
        <h1 className="text-3xl font-bold">Health Twin</h1>
        <p className="mt-4 text-slate-400">
          Health Twin is coming soon. It will help with wellness routines,
          diet suggestions, and local healthy choices.
        </p>
      </SpatialCard>
    </main>
  );
}