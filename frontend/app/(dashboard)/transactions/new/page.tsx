"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const typeOptions = [
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
  { value: "transfer", label: "Transfer" },
];

const categoryOptions = [
  { value: "Penjualan", label: "Penjualan" },
  { value: "Pembelian", label: "Pembelian" },
  { value: "Operasional", label: "Operasional" },
  { value: "Gaji", label: "Gaji & Tunjangan" },
  { value: "Marketing", label: "Marketing & Iklan" },
  { value: "Transportasi", label: "Transportasi" },
  { value: "Utilitas", label: "Utilitas (Listrik, Air, dll)" },
  { value: "Lainnya", label: "Lainnya" },
];

const accountOptions = [
  { value: "cash", label: "Kas" },
  { value: "bank_bca", label: "Bank BCA" },
  { value: "bank_mandiri", label: "Bank Mandiri" },
  { value: "ewallet_gopay", label: "GoPay" },
  { value: "ewallet_ovo", label: "OVO" },
];

export default function NewTransactionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "income",
    category: "",
    account: "cash",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = "Tanggal wajib diisi";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Deskripsi wajib diisi";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Nominal harus lebih dari 0";
    }

    if (!formData.type) {
      newErrors.type = "Tipe transaksi wajib dipilih";
    }

    if (!formData.category) {
      newErrors.category = "Kategori wajib dipilih";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // TODO: Replace with actual API call
    console.log("Form data:", formData);

    setIsLoading(false);
    router.push("/transactions");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back Button */}
      <Link
        href="/transactions"
        className="inline-flex items-center gap-2 text-sm text-[#7E8379] hover:text-[#1F241D] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Transaksi
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1F241D]">
          Tambah Transaksi Baru
        </h1>
        <p className="text-sm text-[#7E8379] mt-1">
          Catat transaksi keuangan usaha Anda dengan detail
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Date */}
              <Input
                label="Tanggal Transaksi"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                error={errors.date}
                required
              />

              {/* Amount */}
              <Input
                label="Nominal"
                type="number"
                name="amount"
                placeholder="0"
                value={formData.amount}
                onChange={handleChange}
                error={errors.amount}
                helperText="Masukkan nominal dalam Rupiah"
                required
              />
            </div>

            {/* Description */}
            <Input
              label="Deskripsi"
              type="text"
              name="description"
              placeholder="Contoh: Penjualan produk A ke pelanggan X"
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Type */}
              <Select
                label="Tipe Transaksi"
                name="type"
                options={typeOptions}
                value={formData.type}
                onChange={handleChange}
                error={errors.type}
                required
              />

              {/* Category */}
              <Select
                label="Kategori"
                name="category"
                options={categoryOptions}
                value={formData.category}
                onChange={handleChange}
                error={errors.category}
                required
              />
            </div>

            {/* Account */}
            <Select
              label="Akun/Metode Pembayaran"
              name="account"
              options={accountOptions}
              value={formData.account}
              onChange={handleChange}
              helperText="Pilih dari mana/kemana uang masuk/keluar"
            />

            {/* Notes */}
            <Textarea
              label="Catatan (Opsional)"
              name="notes"
              placeholder="Tambahkan catatan atau keterangan tambahan..."
              rows={4}
              value={formData.notes}
              onChange={handleChange}
            />

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-[#EBE5DC]">
              <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                {isLoading ? "Menyimpan..." : "Simpan Transaksi"}
              </Button>
              <Link href="/transactions">
                <Button type="button" variant="secondary" disabled={isLoading}>
                  Batal
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Helper Card */}
      <Card className="bg-[#F6EFE9] border-[#E8DDD3]">
        <CardContent className="pt-5">
          <h3 className="text-sm font-semibold text-[#1F241D] mb-2">
            💡 Tips Pencatatan
          </h3>
          <ul className="text-xs text-[#7E8379] space-y-1 list-disc list-inside">
            <li>Catat transaksi segera setelah terjadi untuk akurasi maksimal</li>
            <li>Pastikan kategori sudah sesuai untuk laporan yang tepat</li>
            <li>
              Gunakan deskripsi yang jelas agar mudah ditelusuri di kemudian
              hari
            </li>
            <li>
              Pemasukan = uang masuk, Pengeluaran = uang keluar, Transfer =
              perpindahan antar akun
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
