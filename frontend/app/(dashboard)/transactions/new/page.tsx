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
import { useCreateTransaction } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { getErrorMessage } from "@/lib/api";

interface Toast {
  type: "success" | "error";
  message: string;
}

interface CategoryOption {
  id: number;
  name: string;
  tx_type: string;
}

const typeOptions = [
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
  { value: "transfer", label: "Transfer" },
  { value: "owner_contribution", label: "Setoran Modal" },
  { value: "owner_draw", label: "Penarikan Pemilik" },
  { value: "loan_received", label: "Pinjaman Masuk" },
  { value: "loan_repayment", label: "Cicilan Pinjaman" },
  { value: "refund", label: "Refund" },
];

export default function NewTransactionPage() {
  const router = useRouter();
  const { mutate: createTransaction, isPending: isCreating } = useCreateTransaction();
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<Toast | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "income",
    categoryId: "",
    notes: "",
  });

  const categoryOptions = (categories as CategoryOption[])
    .filter((category) => category.tx_type === formData.type)
    .map((category) => ({ value: String(category.id), label: category.name }));

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Kategori terikat ke tipe transaksi. Reset agar tidak mengirim
      // kategori yang tidak cocok (backend akan menolak dengan 422).
      ...(name === "type" ? { categoryId: "" } : {}),
    }));
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

    if (!formData.categoryId) {
      newErrors.categoryId = "Kategori wajib dipilih";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const description = formData.notes.trim()
      ? `${formData.description.trim()} — ${formData.notes.trim()}`
      : formData.description.trim();

    // Kontrak backend: transaction_date, tx_type, amount, category_id.
    const payload = {
      tx_type: formData.type,
      amount: formData.amount,
      transaction_date: formData.date,
      category_id: Number(formData.categoryId),
      description,
    };

    createTransaction(payload, {
      onSuccess: () => {
        setToast({
          type: "success",
          message: "Transaksi berhasil disimpan",
        });
        setTimeout(() => router.push("/transactions"), 1000);
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(error);
        setToast({
          type: "error",
          message: errorMessage || "Gagal menyimpan transaksi",
        });
        setErrors({ submit: errorMessage });
      },
    });
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
          {toast && (
            <div
              className={`mb-4 p-4 rounded-lg text-sm font-medium ${
                toast.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {toast.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.submit && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                {errors.submit}
              </div>
            )}

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
                name="categoryId"
                options={
                  categoryOptions.length > 0
                    ? categoryOptions
                    : [{ value: "", label: "Belum ada kategori untuk tipe ini" }]
                }
                value={formData.categoryId}
                onChange={handleChange}
                error={errors.categoryId}
                helperText={
                  isCategoriesLoading
                    ? "Memuat kategori..."
                    : "Kategori mengikuti tipe transaksi"
                }
                required
              />
            </div>

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
              <Button type="submit" isLoading={isCreating} disabled={isCreating}>
                {isCreating ? "Menyimpan..." : "Simpan Transaksi"}
              </Button>
              <Link href="/transactions">
                <Button type="button" variant="secondary" disabled={isCreating}>
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
