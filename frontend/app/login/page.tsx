"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { authApi } from "@/features/auth/api/auth-api";
import { saveAccessToken, getAccessToken } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api-client";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  useEffect(() => {
    if (getAccessToken()) {
      router.replace("/dashboard");
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f4f0]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#ffc900] mb-4"></div>
          <p className="text-sm text-[#666666]">Memeriksa sesi...</p>
        </div>
      </div>
    );
  }

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
    <main className="min-h-screen flex">
      {/* LEFT PANEL - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 bg-[#1a1a1a] relative overflow-hidden items-center justify-center p-12">
        {/* Decorative radial gradient */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 66% 55%, rgba(255, 201, 0, 0.08), transparent 42%)',
          }}
        />

        {/* Logo brand - absolute top left */}
        <div className="absolute top-8 left-8 z-20">
          <span className="text-[#ffc900] font-sans text-2xl font-bold tracking-tight">
            ProfitAI
          </span>
        </div>

        {/* Justice statue image - positioned bottom right */}
        <div className="absolute bottom-0 right-0 w-2/5 h-full pointer-events-none opacity-40 mix-blend-screen">
          <Image
            src="/justice-statue.webp"
            alt="Justice statue decoration"
            fill
            className="object-contain object-bottom"
            priority
            unoptimized
          />
        </div>

        {/* Content - hero copy */}
        <div className="relative z-10 max-w-lg">
          <div>
            <h1 className="font-sans text-7xl font-bold leading-none mb-8 tracking-tight">
              <span className="text-white">Know Your</span><br />
              <span className="text-[#ffc900]">Profit.</span><br />
              <span className="text-white">Own your</span><br />
              <span className="text-[#ffc900]">Future.</span>
            </h1>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="flex-1 lg:flex-none lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-[#f5f4f0]">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-white border border-[#77736c] rounded-[34px] p-8 sm:p-10 shadow-md">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-[#111111] mb-2">
                Welcome Back!
              </h2>
              <p className="text-xs sm:text-sm text-[#77736f]">
                Log in to continue to your account.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77736f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                    className="w-full h-12 pl-10 pr-4 border border-[#dedbd5] rounded-[9px] bg-transparent text-sm outline-none placeholder-[#aaa7a1] focus:border-[#c49b00] focus:ring-1 focus:ring-[#ffc900]/14 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-2">
                  Password
                </label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77736f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                    className="w-full h-12 pl-10 pr-10 border border-[#dedbd5] rounded-[9px] bg-transparent text-sm outline-none placeholder-[#aaa7a1] focus:border-[#c49b00] focus:ring-1 focus:ring-[#ffc900]/14 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77736f] hover:text-[#111111] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
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
                    className="w-3.5 h-3.5 rounded border-[#dedbd5] accent-[#ffc900] cursor-pointer"
                  />
                  <span className="text-[#77736f]">Remember Me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[#111111] hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#ffc900] text-[#111111] border border-[#ffc900] rounded-[9px] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#f0bd00] hover:border-[#f0bd00] transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Login"}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e5e2dc]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-xs text-[#aaa7a1] font-medium">
                  OR
                </span>
              </div>
            </div>

            {/* Google Button */}
            <button
              type="button"
              className="w-full h-12 border border-[#dedbd5] rounded-[9px] text-[#171717] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/70 transition-all"
            >
              <span className="text-lg font-bold text-[#4285f4]">G</span>
              Continue with Google
            </button>

            {/* Sign Up Link */}
            <p className="mt-6 text-center text-xs text-[#99958f]">
              Don't have an account?{" "}
              <Link href="/register" className="font-semibold underline">
                Sign Up
              </Link>
            </p>

            {/* Security Note */}
            <p className="mt-7 text-center text-xs text-[#aaa7a1] flex items-center justify-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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


