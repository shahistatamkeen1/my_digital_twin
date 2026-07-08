export default function SectionHeader({
  label,
  title,
}: {
  label?: string;
  title: string;
}) {
  return (
    <div className="mb-4">
      {label && <p className="text-xs font-semibold text-cyan-300">{label}</p>}
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
  );
}