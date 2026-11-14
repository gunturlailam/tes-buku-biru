"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email wajib diisi");
      return;
    }

    // Endpoint reset password belum ada di backend. Jangan menampilkan
    // keberhasilan palsu.
    setError(
      "Fitur reset password belum tersedia di MVP ini. Hubungi admin organisasi untuk melakukan reset.",
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Back to Login */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-[#7E8379] hover:text-[#1F241D] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Login
        </Link>

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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
          <h1 className="font-serif text-3xl tracking-tight leading-none text-[#1F241D] font-semibold mb-2">
            Lupa Password?
          </h1>
          <p className="text-sm text-[#7E8379]">
            Tidak masalah! Kami akan mengirimkan link untuk reset password ke
            email Anda.
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
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="nama@perusahaan.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              helperText="Masukkan email yang terdaftar di akun Anda"
              required
              autoFocus
            />

            <Button type="submit" className="w-full" size="lg">
              Kirim Link Reset Password
            </Button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-[#EBE5DC]">
            <div className="bg-[#F6EFE9] border border-[#EBE5DC] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#1F241D] mb-2">
                Status Fitur
              </p>
              <p className="text-xs text-[#7E8379]">
                Reset password mandiri belum tersedia. Untuk sementara, admin
                organisasi perlu melakukan reset melalui prosedur internal.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <p className="text-center text-xs text-[#7E8379] mt-6">
          Masih bermasalah? Hubungi admin organisasi Anda.
        </p>
      </div>
    </div>
  );
}
