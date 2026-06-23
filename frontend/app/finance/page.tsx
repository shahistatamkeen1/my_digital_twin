import SpatialCard from "../components/SpatialCard";

export default function FinancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-8 text-white">
      <SpatialCard className="max-w-xl">
        <h1 className="text-3xl font-bold">Finance Twin</h1>
        <p className="mt-4 text-slate-400">
          Finance Twin is coming soon. It will help with spending insights,
          budgeting, savings goals, and financial alerts.
        </p>
      </SpatialCard>
    </main>
  );
}