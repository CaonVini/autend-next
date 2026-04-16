import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  endAdornment?: ReactNode;
  endAdornmentInteractive?: boolean;
};

export function Input({
  className = "",
  endAdornment,
  endAdornmentInteractive = false,
  error,
  hint,
  id,
  label,
  ...props
}: InputProps) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#546257]">{label}</span>
        {hint}
      </div>
      <div className="relative">
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[
            "h-12 w-full rounded-xl border bg-white px-4 text-sm text-[#07140a] outline-none placeholder:text-[#8b988f] focus:ring-4",
            error
              ? "border-[#dc6d6d] focus:border-[#dc6d6d] focus:ring-[#dc6d6d]/10"
              : "border-[#d9ddd7] focus:border-[#1e6f3a] focus:ring-[#1e6f3a]/10",
            endAdornment ? "pr-11" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {endAdornment ? (
          <div
            className={[
              "absolute inset-y-0 right-0 flex items-center pr-4 text-[#96a198]",
              endAdornmentInteractive ? "" : "pointer-events-none",
            ].join(" ")}
          >
            {endAdornment}
          </div>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-[#bb4d4d]">
          {error}
        </p>
      ) : null}
    </label>
  );
}
