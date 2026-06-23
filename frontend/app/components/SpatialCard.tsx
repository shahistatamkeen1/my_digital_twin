type SpatialCardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function SpatialCard({
  children,
  className = "",
}: SpatialCardProps) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}