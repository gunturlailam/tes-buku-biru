"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { authApi } from "@/features/auth/api/auth-api";
import { saveAccessToken } from "@/lib/auth";
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
    <div className="min-h-screen bg-[#FAF7F2] flex">
      {/* LEFT PANEL - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 bg-[#273420] relative overflow-hidden items-center justify-center p-12">
        {/* Decorative radial gradient */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 66% 55%, rgba(163, 168, 138, 0.15), transparent 42%)',
          }}
        />

        {/* Logo brand - absolute top */}
        <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <svg
              className="w-6 h-6 text-[#A3A88A]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
          <span className="text-white font-serif text-lg font-semibold tracking-tight">
            ProfitAI
          </span>
        </div>

        {/* Justice statue image - positioned bottom right */}
        <div className="absolute bottom-0 right-2 w-1/2 h-full pointer-events-none opacity-35 mix-blend-screen">
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
        <div className="relative z-10 max-w-lg text-white">
          <div className="mb-12">
            <h1 className="font-serif text-6xl font-bold leading-tight mb-6 tracking-tight">
              Pahami<br />
              <span className="text-[#A3A88A]">Laba Anda.</span><br />
              Kuasai<br />
              <span className="text-[#A3A88A]">Masa Depan.</span>
            </h1>
            <p className="text-lg text-[#C5CCC0] leading-relaxed max-w-md">
              Platform financial intelligence yang membantu UMKM memahami kondisi keuangan dengan analisis mendalam, forecasting akurat, dan rekomendasi berbasis data.
            </p>
          </div>

          {/* Features showcase */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20 backdrop-blur-sm">
                <svg
                  className="w-6 h-6 text-[#A3A88A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Dashboard Analitik Mendalam</h3>
                <p className="text-sm text-[#C5CCC0]">
                  Pantau revenue, expense, cash flow, dan indikator kesehatan keuangan real-time
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20 backdrop-blur-sm">
                <svg
                  className="w-6 h-6 text-[#A3A88A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Forecasting Tervalidasi</h3>
                <p className="text-sm text-[#C5CCC0]">
                  Prediksi arus kas dan pendapatan dengan backtest accuracy, bukan spekulasi
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20 backdrop-blur-sm">
                <svg
                  className="w-6 h-6 text-[#A3A88A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Rekomendasi Berbasis AI</h3>
                <p className="text-sm text-[#C5CCC0]">
                  Insight akurat dengan evidence yang dapat ditelusuri, bukan angka yang dikarang
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="text-xs text-[#C5CCC0] uppercase tracking-widest font-semibold">
              Dipercaya oleh UMKM di seluruh Indonesia
            </div>
          </div>
        </div>

        {/* Floating decorative elements */}
        <div className="absolute bottom-8 right-8 w-32 h-32 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 rotate-12"></div>
        <div className="absolute top-24 right-32 w-24 h-24 rounded-full bg-[#A3A88A]/20 backdrop-blur-sm"></div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="flex-1 lg:flex-none lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 sm:mb-10">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F241D] mb-3">
              Selamat Datang Kembali
            </h2>
            <p className="text-sm sm:text-base text-[#7E8379]">
              Masuk ke akun Anda untuk melanjutkan ke dashboard
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
            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="nama@perusahaan.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Masukkan password Anda"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-[#7E8379] hover:text-[#1F241D] transition-colors"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer hover:text-[#273420] transition-colors">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-[#EBE5DC] text-[#273420] focus:ring-[#314028] focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-[#1F241D]">Ingat saya</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-sm text-[#314028] hover:text-[#273420] font-medium transition-colors"
              >
                Lupa password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#314028] hover:bg-[#273420] transition-colors"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EBE5DC]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#FAF7F2] px-3 text-xs text-[#7E8379] font-semibold uppercase tracking-wide">
                Demo
              </span>
            </div>
          </div>

          {/* Demo Credentials Card */}
          <div className="bg-[#F6EFE9] border border-[#EBE5DC] rounded-2xl p-4 mb-8">
            <p className="text-xs font-semibold text-[#1F241D] mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[#8FA382]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span>Demo Account Ready</span>
            </p>
            <div className="space-y-2 text-xs text-[#7E8379] font-mono">
              <p>
                <span className="text-[#1F241D] font-semibold">Email:</span><br />
                <span className="text-[#314028] font-medium">demo@profitai.local</span>
              </p>
              <p>
                <span className="text-[#1F241D] font-semibold">Password:</span><br />
                <span className="text-[#314028] font-medium">Demo12345!</span>
              </p>
            </div>
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-[#7E8379]">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-[#314028] hover:text-[#273420] font-semibold transition-colors"
            >
              Daftar sekarang
            </Link>
          </p>

          {/* Security note */}
          <p className="mt-8 text-center text-xs text-[#C5CCC0] flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <span>Data Anda dilindungi dan privat</span>
          </p>
        </div>
      </div>
    </div>
  );
}
