"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { authApi } from "@/features/auth/api/auth-api";
import { saveAccessToken, clearAccessToken, getAccessToken } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api-client";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  // Clear any stale token when landing on login page
  useEffect(() => {
    // If user already has valid token and is redirected to login, clear it
    // This ensures fresh login without stale token interference
    if (getAccessToken()) {
      clearAccessToken();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Email dan password wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      const { access_token } = await authApi.login({
        email: formData.email,
        password: formData.password,
      });
      saveAccessToken(access_token, formData.remember);
      router.replace("/dashboard");
    } catch (error) {
      setError(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-[#f5f4f0]">
      {/* LEFT PANEL - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden items-center justify-between px-12">
        {/* Logo brand - top left */}
        <div className="absolute top-6 left-12 z-20">
          <span className="text-[#ffc900] font-sans text-3xl font-bold tracking-tight">
            ProfitAI
          </span>
        </div>

        {/* Content - hero copy, left aligned */}
        <div className="relative z-10 max-w-md">
          <h1 className="font-sans text-6xl font-bold leading-tight tracking-tight">
            <span className="text-white">Know Your</span><br />
            <span className="text-[#ffc900]">Profit.</span><br />
            <span className="text-white">Own your</span><br />
            <span className="text-[#ffc900]">Future.</span>
          </h1>
        </div>

        {/* Justice statue image - right side, shifted up to top */}
        <div className="absolute right-0 top-0 w-3/5 h-full pointer-events-none opacity-60">
          <Image
            src="/justice-statue.webp"
            alt="Justice statue decoration"
            fill
            className="object-contain object-center"
            unoptimized
          />
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8 bg-[#f5f4f0]">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white border-2 border-[#d5d5d5] rounded-3xl p-8 shadow-lg">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-[#111111] mb-1">
                Welcome Back!
              </h2>
              <p className="text-sm text-[#999999]">
                Log in to continue to your account.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-[#111111] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999999]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3.5" y="5.5" width="17" height="13" rx="2"/>
                    <path d="m4.5 7 7.5 5.5L19.5 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email address."
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    className="w-full h-12 pl-12 pr-4 border border-[#e0e0e0] rounded-xl bg-[#fafafa] text-sm outline-none placeholder-[#cccccc] focus:border-[#ffc900] focus:ring-1 focus:ring-[#ffc900]/20 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-[#111111] mb-2">
                  Password
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999999]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="5" y="10" width="14" height="10" rx="2"/>
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round"/>
                    <path d="M12 14v2" strokeLinecap="round"/>
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password."
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    className="w-full h-12 pl-12 pr-12 border border-[#e0e0e0] rounded-xl bg-[#fafafa] text-sm outline-none placeholder-[#cccccc] focus:border-[#ffc900] focus:ring-1 focus:ring-[#ffc900]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#111111] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-[#e0e0e0] accent-[#ffc900] cursor-pointer"
                  />
                  <span className="text-[#666666]">Remember Me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[#111111] hover:underline font-semibold"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#ffc900] text-[#111111] border border-[#ffc900] rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#f0bd00] hover:border-[#f0bd00] transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Login"}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e0e0e0]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-[#999999] font-medium">
                  OR
                </span>
              </div>
            </div>

            {/* Google Button */}
            <button
              type="button"
              className="w-full h-11 border-2 border-[#e0e0e0] rounded-xl text-[#111111] font-semibold text-sm flex items-center justify-center gap-3 hover:bg-[#f9f9f9] transition-all"
            >
              <span className="text-lg font-bold text-[#4285f4]">G</span>
              Continue with Google
            </button>

            {/* Sign Up Link */}
            <p className="mt-4 text-center text-xs text-[#999999]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-[#111111] underline hover:no-underline">
                Sign Up
              </Link>
            </p>

            {/* Security Note */}
            <p className="mt-4 text-center text-xs text-[#999999] flex items-center justify-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="10" width="14" height="10" rx="2"/>
                <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round"/>
              </svg>
              Your data. Protected and private.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
