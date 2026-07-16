import CareerSidebar from "./components/CareerSidebar";

export default function CareerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <CareerSidebar />

      <main className="min-h-screen pb-28 pt-20 lg:ml-64 lg:pb-0 lg:pt-0">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}