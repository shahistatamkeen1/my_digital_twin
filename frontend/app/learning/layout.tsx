import type { ReactNode } from "react";
import LearningSidebar from "./components/LearningSidebar";

export default function LearningLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <LearningSidebar />

      <main className="min-h-screen px-4 pb-12 pt-24 sm:px-6 lg:ml-64 lg:px-8 lg:pt-8 xl:px-10">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
