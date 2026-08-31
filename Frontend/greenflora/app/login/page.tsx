/**
 * app/login/page.tsx
 *
 * Green Flora login page.
 *
 * Renders inside AuthLayout (nature-inspired background, centered card).
 * Provides email-or-phone + password login with show/hide toggle,
 * loading state, inline error display, and a link to the signup page.
 */

"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import AuthLayout from "@/components/layout/AuthLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/Hooks/useAuth";
import { AuthApiError } from "@/services/AuthAPI";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ contact: contact.trim(), password });
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof AuthApiError
          ? err.message
          : "Something went wrong. Please try again.";
      setError(message);
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate>
        <h1 className="mb-1 text-lg font-semibold text-neutral-900">
          Welcome back
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          Sign in to your Green Flora account
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
          <Input
            label="Email or phone"
            name="contact"
            type="text"
            autoComplete="username"
            placeholder="you@example.com or +92..."
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
          />

          <div className="relative">
            <Input
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
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
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="mt-6 w-full"
        >
          Sign In
        </Button>

        <p className="mt-5 text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary-700 hover:text-primary-800 transition-colors"
          >
            Create account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
