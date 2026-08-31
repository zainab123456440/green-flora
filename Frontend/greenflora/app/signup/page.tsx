/**
 * app/signup/page.tsx
 *
 * Green Flora signup page.
 *
 * Collects name, email-or-phone (with a friendly toggle), and password.
 * Includes client-side validation, a password strength indicator,
 * confirm-password check, and smooth tab switching.
 */

"use client";

import { useState, useMemo, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Phone } from "lucide-react";

import AuthLayout from "@/components/layout/AuthLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/Hooks/useAuth";
import { AuthApiError } from "@/services/AuthAPI";

// ---------------------------------------------------------------------------
// Password strength (simple heuristic — not a security guarantee)
// ---------------------------------------------------------------------------

type Strength = "weak" | "fair" | "good" | "strong";

function getPasswordStrength(pw: string): { score: number; label: Strength } {
  if (!pw) return { score: 0, label: "weak" };

  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: "weak" };
  if (score === 2) return { score: 2, label: "fair" };
  if (score === 3) return { score: 3, label: "good" };
  return { score: 4, label: "strong" };
}

const strengthColors: Record<Strength, string> = {
  weak: "bg-danger-500",
  fair: "bg-amber-500",
  good: "bg-primary-500",
  strong: "bg-primary-700",
};

const strengthLabels: Record<Strength, string> = {
  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type ContactMode = "email" | "phone";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [contactMode, setContactMode] = useState<ContactMode>("email");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  function validate(): string | null {
    if (!name.trim()) return "Please enter your name.";
    if (!contact.trim())
      return contactMode === "email"
        ? "Please enter your email address."
        : "Please enter your phone number.";

    if (contactMode === "email" && !contact.includes("@")) {
      return "Please enter a valid email address.";
    }

    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";

    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      return;
    }

    setIsLoading(true);

    try {
      await signup({ name: name.trim(), contact: contact.trim(), password });
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof AuthApiError
          ? err.message
          : "Could not create account. Please try again.";
      setError(message);
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
    } finally {
      setIsLoading(false);
    }
  }

  function switchMode(mode: ContactMode) {
    setContactMode(mode);
    setContact(""); // clear when switching
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate>
        <h1 className="mb-1 text-lg font-semibold text-neutral-900">
          Create your account
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          Join Green Flora and start managing your farm smarter
        </p>

        {/* Error message */}
        {error && (
          <div
            className={`mb-4 rounded-md bg-danger-50 border border-danger-100 px-3 py-2.5 text-sm text-danger-600 ${
              shakeError ? "animate-gf-shake" : ""
            }`}
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Name */}
          <Input
            label="Your name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Muhammad Asif"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Contact mode toggle */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Contact method
            </label>
            <div className="relative flex rounded-md bg-neutral-100 p-1">
              <button
                type="button"
                onClick={() => switchMode("email")}
                className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 text-sm font-medium transition-colors duration-200 ${
                  contactMode === "email"
                    ? "text-primary-800"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </button>
              <button
                type="button"
                onClick={() => switchMode("phone")}
                className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 text-sm font-medium transition-colors duration-200 ${
                  contactMode === "phone"
                    ? "text-primary-800"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                <Phone className="h-3.5 w-3.5" />
                Phone
              </button>
              {/* Sliding indicator */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded bg-surface-card shadow-sm transition-transform duration-200 ease-out ${
                  contactMode === "phone"
                    ? "translate-x-[calc(100%+4px)]"
                    : "translate-x-0"
                }`}
                style={{ left: "4px" }}
              />
            </div>
          </div>

          {/* Contact input */}
          <Input
            label={contactMode === "email" ? "Email address" : "Phone number"}
            name="contact"
            type={contactMode === "email" ? "email" : "tel"}
            autoComplete={contactMode === "email" ? "email" : "tel"}
            placeholder={
              contactMode === "email"
                ? "you@example.com"
                : "+92-3XX-XXXXXXX"
            }
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
          />

          {/* Password */}
          <div>
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-[34px] text-neutral-400 hover:text-neutral-600 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Strength indicator */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        level <= strength.score
                          ? strengthColors[strength.label]
                          : "bg-neutral-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Password strength:{" "}
                  <span className="font-medium">
                    {strengthLabels[strength.label]}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="relative">
            <Input
              label="Confirm password"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              error={
                confirmPassword.length > 0 && password !== confirmPassword
                  ? "Passwords do not match"
                  : undefined
              }
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-[34px] text-neutral-400 hover:text-neutral-600 transition-colors"
              tabIndex={-1}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="mt-6 w-full"
        >
          Create Account
        </Button>

        <p className="mt-5 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary-700 hover:text-primary-800 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
