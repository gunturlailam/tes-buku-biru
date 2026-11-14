"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { authApi } from "@/features/auth/api/auth-api";
import { getErrorMessage } from "@/lib/api-client";

const industryOptions = [
  { value: "", label: "Pilih industri..." },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "fnb", label: "Food & Beverage" },
  { value: "manufacturing", label: "Manufaktur" },
  { value: "services", label: "Jasa & Konsultan" },
  { value: "technology", label: "Teknologi" },
  { value: "others", label: "Lainnya" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    businessName: "",
    fullName: "",
    email: "",
    industry: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.businessName || !formData.fullName || !formData.email || !formData.password) {
      setError("Semua field wajib diisi");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak sama");
      return;
    }

    if (!formData.terms) {
      setError("Anda harus menyetujui syarat dan ketentuan");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        organization_name: formData.businessName,
        industry: formData.industry || undefined,
      });
      router.push("/login?registered=true");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
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
          </Link>
          <h1 className="font-serif text-4xl tracking-tight leading-none text-[#1F241D] font-semibold">
            Daftar ProfitAI
          </h1>
          <p className="text-sm text-[#7E8379] mt-2">
            Mulai kelola keuangan usaha Anda dengan lebih cerdas
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-[#EBE5DC]/70 shadow-[0_8px_30px_-4px_rgba(44,56,37,0.05)] p-8">
          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Business Information */}
            <div className="pb-4">
              <h3 className="text-sm font-semibold text-[#1F241D] uppercase tracking-wide mb-4">
                Informasi Usaha
              </h3>
              <div className="space-y-4">
                <Input
                  label="Nama Usaha"
                  name="businessName"
                  placeholder="Contoh: Toko Bahagia Sejahtera"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                />

                <Select
                  label="Industri"
                  name="industry"
                  options={industryOptions}
                  value={formData.industry}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Personal Information */}
            <div className="pb-4 border-t border-[#EBE5DC] pt-4">
              <h3 className="text-sm font-semibold text-[#1F241D] uppercase tracking-wide mb-4">
                Informasi Pribadi
              </h3>
              <div className="space-y-4">
                <Input
                  label="Nama Lengkap"
                  name="fullName"
                  placeholder="Nama lengkap Anda"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  name="email"
                  placeholder="nama@perusahaan.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Security */}
            <div className="pb-4 border-t border-[#EBE5DC] pt-4">
              <h3 className="text-sm font-semibold text-[#1F241D] uppercase tracking-wide mb-4">
                Keamanan Akun
              </h3>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Minimal 8 karakter"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    helperText="Gunakan kombinasi huruf, angka, dan simbol"
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

                <div className="relative">
                  <Input
                    label="Konfirmasi Password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Ketik ulang password Anda"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-[38px] text-[#7E8379] hover:text-[#1F241D] transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
                className="w-4 h-4 mt-0.5 rounded border-[#EBE5DC] text-[#273420] focus:ring-[#314028] focus:ring-offset-0"
                required
              />
              <label className="text-sm text-[#7E8379]">
                Saya menyetujui{" "}
                <Link
                  href="/terms"
                  className="text-[#314028] hover:text-[#273420] font-medium"
                >
                  Syarat & Ketentuan
                </Link>{" "}
                serta{" "}
                <Link
                  href="/privacy"
                  className="text-[#314028] hover:text-[#273420] font-medium"
                >
                  Kebijakan Privasi
                </Link>{" "}
                ProfitAI
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-[#EBE5DC] text-center">
            <p className="text-sm text-[#7E8379]">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="text-[#314028] hover:text-[#273420] font-semibold transition-colors"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#7E8379] mt-6">
          © 2026 ProfitAI. All rights reserved.
        </p>
      </div>
    </div>
  );
}
