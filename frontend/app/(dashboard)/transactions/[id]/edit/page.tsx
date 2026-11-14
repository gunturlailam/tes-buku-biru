"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTransaction, useUpdateTransaction } from "@/hooks/use-transactions";
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

interface TransactionRecord {
  id: number;
  transaction_date: string;
  description: string;
  amount: string | number;
  tx_type: string;
  category_id: number | null;
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

function EditTransactionForm({
  transaction,
}: {
  transaction: TransactionRecord;
}) {
  const router = useRouter();
  const { mutate: updateTransaction, isPending: isUpdating } =
    useUpdateTransaction();
  const { data: categories = [], isLoading: isCategoriesLoading } =
    useCategories();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<Toast | null>(null);

  // State diinisialisasi dari data server. Form di-remount lewat `key` ketika
  // transaksi berubah, sehingga tidak perlu setState di dalam useEffect.
  const [formData, setFormData] = useState({
    date: transaction.transaction_date || "",
    description: transaction.description || "",
    amount: String(transaction.amount ?? ""),
    type: transaction.tx_type || "income",
    categoryId: transaction.category_id ? String(transaction.category_id) : "",
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
      ...(name === "type" ? { categoryId: "" } : {}),
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = "Tanggal wajib diisi";
    if (!formData.description.trim())
      newErrors.description = "Deskripsi wajib diisi";
    if (!formData.amount || parseFloat(formData.amount) <= 0)
      newErrors.amount = "Nominal harus lebih dari 0";
    if (!formData.type) newErrors.type = "Tipe transaksi wajib dipilih";
    if (!formData.categoryId) newErrors.categoryId = "Kategori wajib dipilih";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      tx_type: formData.type,
      amount: formData.amount,
      transaction_date: formData.date,
      category_id: Number(formData.categoryId),
      description: formData.description.trim(),
    };

    updateTransaction(
      { id: transaction.id, data: payload },
      {
        onSuccess: () => {
          setToast({
            type: "success",
            message: "Transaksi berhasil diperbarui",
          });
          setTimeout(() => router.push("/transactions"), 1000);
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error);
          setToast({
            type: "error",
            message: errorMessage || "Gagal memperbarui transaksi",
          });
          setErrors({ submit: errorMessage });
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/transactions"
        className="inline-flex items-center gap-2 text-sm text-[#7E8379] hover:text-[#1F241D] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Transaksi
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-[#1F241D]">
          Edit Transaksi
        </h1>
        <p className="text-sm text-[#7E8379] mt-1">
          Perbarui informasi transaksi
        </p>
      </div>

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
              <Input
                label="Tanggal Transaksi"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                error={errors.date}
                required
              />

              <Input
                label="Nominal"
                type="number"
                name="amount"
                placeholder="0"
                value={formData.amount}
                onChange={handleChange}
                error={errors.amount}
                required
              />
            </div>

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
              <Select
                label="Tipe Transaksi"
                name="type"
                options={typeOptions}
                value={formData.type}
                onChange={handleChange}
                error={errors.type}
                required
              />

              <Select
                label="Kategori"
                name="categoryId"
                options={
                  categoryOptions.length > 0
                    ? categoryOptions
                    : [
                        {
                          value: "",
                          label: "Belum ada kategori untuk tipe ini",
                        },
                      ]
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

            <div className="flex items-center gap-3 pt-4 border-t border-[#EBE5DC]">
              <Button
                type="submit"
                isLoading={isUpdating}
                disabled={isUpdating}
              >
                {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
              <Link href="/transactions">
                <Button type="button" variant="secondary" disabled={isUpdating}>
                  Batal
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditTransactionPage() {
  const params = useParams();
  const transactionId = parseInt(params.id as string, 10);
  const {
    data: existingTx,
    isLoading,
    error,
  } = useTransaction(transactionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !existingTx) {
    return (
      <div className="max-w-3xl space-y-4">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-2 text-sm text-[#7E8379] hover:text-[#1F241D] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Transaksi
        </Link>
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          Transaksi tidak ditemukan atau gagal dimuat.
        </div>
      </div>
    );
  }

  return (
    <EditTransactionForm
      key={existingTx.id}
      transaction={existingTx as TransactionRecord}
    />
  );
}
