"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

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

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock authentication
    if (
      formData.email === "demo@profitai.id" &&
      formData.password === "demo123"
    ) {
      router.push("/dashboard");
    } else {
      setError("Email atau password salah. Gunakan demo@profitai.id / demo123");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#273420] mb-4">
              <svg
                className="w-7 h-7 text-white"
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
            <h1 className="font-serif text-4xl tracking-tight leading-none text-[#1F241D] font-semibold">
              ProfitAI
            </h1>
            <p className="text-sm font-semibold tracking-[0.24em] text-[#7E8379] uppercase mt-1">
              Financial Intelligence
            </p>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-semibold text-[#1F241D] mb-2">
              Selamat Datang Kembali
            </h2>
            <p className="text-sm text-[#7E8379]">
              Masuk ke akun Anda untuk melanjutkan
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
              label="Email"
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
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-[#EBE5DC] text-[#273420] focus:ring-[#314028] focus:ring-offset-0"
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
              className="w-full"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EBE5DC]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#FAF7F2] px-3 text-[#7E8379] font-medium tracking-wide">
                Atau
              </span>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="bg-[#F6EFE9] border border-[#EBE5DC] rounded-2xl p-4 mb-6">
            <p className="text-xs font-semibold text-[#1F241D] mb-2 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[#C98A82]"
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
              Demo Account
            </p>
            <div className="space-y-1 text-xs text-[#7E8379]">
              <p>
                <span className="font-medium text-[#1F241D]">Email:</span>{" "}
                demo@profitai.id
              </p>
              <p>
                <span className="font-medium text-[#1F241D]">Password:</span>{" "}
                demo123
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
        </div>
      </div>

      {/* Right Side - Image/Illustration */}
      <div className="hidden lg:flex flex-1 bg-[#273420] relative overflow-hidden items-center justify-center p-12">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <defs>
              <pattern
                id="grid"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg text-white">
          <div className="mb-8">
            <h2 className="font-serif text-5xl font-bold leading-tight mb-4">
              Kelola Keuangan
              <br />
              dengan Lebih
              <br />
              Cerdas
            </h2>
            <p className="text-lg text-[#C5CCC0] leading-relaxed">
              Platform financial intelligence yang membantu Anda memahami
              kondisi keuangan usaha dengan analisis mendalam dan rekomendasi
              berbasis AI.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-[#8FA382]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">
                  Dashboard Analitik
                </h3>
                <p className="text-sm text-[#C5CCC0]">
                  Pantau metrik keuangan penting dalam satu tampilan
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-[#8FA382]"
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
              <div>
                <h3 className="font-semibold text-white mb-1">
                  Forecasting Akurat
                </h3>
                <p className="text-sm text-[#C5CCC0]">
                  Prediksi arus kas dan pendapatan dengan validasi ketat
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-[#8FA382]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">
                  Rekomendasi AI
                </h3>
                <p className="text-sm text-[#C5CCC0]">
                  Dapatkan insight dan saran berbasis data usaha Anda
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 pt-8 border-t border-white/20 grid grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-serif font-bold text-white mb-1">
                1000+
              </p>
              <p className="text-xs text-[#C5CCC0] uppercase tracking-wide">
                Pengguna Aktif
              </p>
            </div>
            <div>
              <p className="text-3xl font-serif font-bold text-white mb-1">
                98%
              </p>
              <p className="text-xs text-[#C5CCC0] uppercase tracking-wide">
                Kepuasan
              </p>
            </div>
            <div>
              <p className="text-3xl font-serif font-bold text-white mb-1">
                24/7
              </p>
              <p className="text-xs text-[#C5CCC0] uppercase tracking-wide">
                Support
              </p>
            </div>
          </div>
        </div>

        {/* Floating decoration */}
        <div className="absolute bottom-8 right-8 w-32 h-32 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 rotate-12"></div>
        <div className="absolute top-12 right-24 w-20 h-20 rounded-full bg-[#8FA382]/20 backdrop-blur-sm"></div>
      </div>
    </div>
  );
}
