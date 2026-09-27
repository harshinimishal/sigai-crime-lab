/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getRedirectUrlForProgress } from "@/lib/progress";
import { getCurrentUser } from "@/lib/auth";

type SignupFormData = {
  name: string;
  email: string;
  password: string;
};

const initialFormData: SignupFormData = {
  name: "",
  email: "",
  password: "",
};

function getSignupErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("duplicate") ||
    normalizedMessage.includes("unique")
  ) {
    return "An account with this email already exists.";
  }

  return message;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Something went wrong while creating your account.";
}

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>(initialFormData);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user already has an active session and redirect accordingly
  useEffect(() => {
    async function checkActiveSession() {
      const user = await getCurrentUser();
      if (user) {
        try {
          const { data: userData } = await supabase
            .from("users")
            .select("round3_answer")
            .eq("id", user.id)
            .single();

          const redirectUrl = getRedirectUrlForProgress(userData?.round3_answer);
          router.replace(redirectUrl);
        } catch (error) {
          console.error("Failed to fetch progress for active session:", error);
        }
      }
    }
    checkActiveSession();
  }, [router]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!name) {
      return "Please enter your name.";
    }

    if (!email) {
      return "Please enter your email address.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address.";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setIsError(true);
      setMessage(validationError);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setMessage("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();

    try {
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password: formData.password,
      });

      if (signupError) {
        throw signupError;
      }

      const authUser = authData.user;

      if (!authUser) {
        throw new Error("Unable to create your account. Please try again.");
      }

      if (!authData.session) {
        throw new Error(
          "Email confirmation is still enabled in Supabase. Disable email confirmation so signup creates a session immediately.",
        );
      }

      const { error: insertError } = await supabase.from("users").insert({
        id: authUser.id,
        name,
        email,
      });

      if (insertError) {
        throw insertError;
      }

      setIsError(false);
      setMessage("Account created. Opening Round 1...");
      router.replace("/round1");
    } catch (error) {
      console.error("Signup failed:", error);

      setIsError(true);
      setMessage(getSignupErrorMessage(getErrorMessage(error)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen lg:h-screen w-screen bg-black text-white lg:overflow-hidden">
      <div className="relative hidden flex-1 overflow-hidden lg:block">
        <div className="absolute left-6 top-6 z-10">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Back to home"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition hover:bg-black/45"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
        </div>

        <img
          src="/login-img.jpeg"
          alt="Crime lab investigation"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mb-6 flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-white lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <h1
              className="mb-3 text-6xl font-bold leading-none text-white sm:text-7xl"
              style={{
                fontFamily: "var(--font-league-gothic)",
              }}
            >
              Join AI Crime Lab
            </h1>
            <p
              className="text-sm text-zinc-400"
              style={{
                fontFamily: "var(--font-montserrat)",
              }}
            >
              Create your investigator profile to start Round 1.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-200">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your name"
                autoComplete="name"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-200">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-200">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 rounded-full p-1 text-zinc-400 transition -translate-y-1/2 hover:bg-zinc-800 hover:text-white"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {message && (
              <div
                role="status"
                className={`rounded-xl border px-4 py-3 text-sm ${
                  isError
                    ? "border-red-500/40 bg-red-950/50 text-red-200"
                    : "border-emerald-500/40 bg-emerald-950/50 text-emerald-200"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:text-zinc-900"
            >
              {isLoading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-zinc-400">
            Already have an investigator profile?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="font-semibold text-white underline transition hover:text-zinc-200"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
