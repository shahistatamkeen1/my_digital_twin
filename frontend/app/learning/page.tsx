import SpatialCard from "../components/SpatialCard";

export default function LearningPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-8 text-white">
      <SpatialCard className="max-w-xl">
        <h1 className="text-3xl font-bold">Learning Twin</h1>
        <p className="mt-4 text-slate-400">
          Learning Twin is coming soon. It will help with skill roadmaps,
          certification prep, and study planning.
        </p>
      </SpatialCard>
    </main>
  );
}