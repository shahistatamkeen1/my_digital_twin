import LearningSidebar from "./components/LearningSidebar";

export default function LearningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <LearningSidebar />
      <main className="ml-64 min-h-screen">{children}</main>
    </div>
  );
}