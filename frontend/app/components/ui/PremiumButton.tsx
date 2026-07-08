export default function PremiumButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`gradient-button rounded-xl px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition ${className}`}
    >
      {children}
    </button>
  );
}