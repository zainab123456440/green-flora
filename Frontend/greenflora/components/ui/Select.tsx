import type { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export default function Select({
  label,
  error,
  hint,
  options,
  placeholder,
  id,
  className = "",
  ...rest
}: SelectProps) {
  const selectId = id ?? rest.name;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full rounded-input border bg-surface-input px-3 py-2 text-sm text-neutral-900
          transition-colors duration-150
          focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600
          ${error ? "border-danger-500" : "border-neutral-200"}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-danger-600">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      )}
    </div>
  );
}
