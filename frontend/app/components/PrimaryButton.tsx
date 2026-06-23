import Link from "next/link";

type PrimaryButtonProps = {
  href?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

export default function PrimaryButton({
  href,
  children,
  onClick,
}: PrimaryButtonProps) {
  const className =
    "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 hover:opacity-90";

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}