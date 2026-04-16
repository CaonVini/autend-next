import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#1e6f3a] text-white shadow-[0_16px_32px_rgba(30,111,58,0.18)] hover:bg-[#17572d] focus-visible:ring-[#1e6f3a]/30",
  secondary:
    "border border-[#d9ddd7] bg-white text-[#07140a] hover:bg-[#f5f6f3] focus-visible:ring-[#d9ddd7]",
  ghost:
    "bg-transparent text-[#1e6f3a] hover:bg-[#eff6f0] focus-visible:ring-[#1e6f3a]/20",
};

export function Button({
  children,
  className = "",
  fullWidth = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
        fullWidth ? "w-full" : "",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
