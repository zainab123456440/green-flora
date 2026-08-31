import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export default function Input({
  label,
  error,
  hint,
  id,
  className = "",
  ...rest
}: InputProps) {
  const inputId = id ?? rest.name;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-input border bg-surface-input px-3 py-2 text-sm text-neutral-900
          placeholder:text-neutral-400
          transition-colors duration-150
          focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600
          ${error ? "border-danger-500" : "border-neutral-200"}`}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-xs text-danger-600">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      )}
    </div>
  );
}
