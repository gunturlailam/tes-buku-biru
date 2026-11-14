"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTransaction, useUpdateTransaction } from "@/hooks/use-transactions";
import { getErrorMessage } from "@/lib/api";

interface Toast {
  type: "success" | "error";
  message: string;
}

// Helper function to map category name to ID
const getCategoryIdByName = (categoryName: string): number => {
  const categoryMap: Record<string, number> = {
    "Penjualan": 1,
    "Pembelian": 2,
    "Operasional": 3,
    "Gaji": 4,
    "Marketing": 5,
    "Transportasi": 6,
    "Utilitas": 7,
    "Lainnya": 8,
  };
  return categoryMap[categoryName] || 1;
};

// Helper function to map category ID back to name
const getCategoryNameById = (categoryId: number): string => {
  const idToNameMap: Record<number, string> = {
    1: "Penjualan",
    2: "Pembelian",
    3: "Operasional",
    4: "Gaji",
    5: "Marketing",
    6: "Transportasi",
    7: "Utilitas",
    8: "Lainnya",
  };
  return idToNameMap[categoryId] || "";
};

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

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = parseInt(params.id as string, 10);

  const { data: existingTx, isLoading: isFetching } = useTransaction(transactionId);
  const { mutate: updateTransaction, isPending: isUpdating } = useUpdateTransaction();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<Toast | null>(null);

  const [formData, setFormData] = useState({
    date: "",
    description: "",
    amount: "",
    type: "income",
    category: "",
    account: "cash",
    notes: "",
  });

  // Load existing transaction data into form
  useEffect(() => {
    if (existingTx) {
      setFormData({
        date: existingTx.tx_date || existingTx.transaction_date || "",
        description: existingTx.description || "",
        amount: String(existingTx.amount || ""),
        type: existingTx.tx_type || "income",
        category: getCategoryNameById(existingTx.category_id) || "",
        account: existingTx.account || "cash",
        notes: existingTx.counterparty || existingTx.notes || "",
      });
    }
  }, [existingTx]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    // Prepare payload for API
    const payload = {
      tx_type: formData.type,
      amount: formData.amount,
      tx_date: formData.date,
      category_id: getCategoryIdByName(formData.category),
      description: formData.description || "",
      counterparty: formData.notes || "",
    };

    updateTransaction(
      { id: transactionId, data: payload },
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

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
                name="category"
                options={categoryOptions}
                value={formData.category}
                onChange={handleChange}
                error={errors.category}
                required
              />
            </div>

            <Select
              label="Akun/Metode Pembayaran"
              name="account"
              options={accountOptions}
              value={formData.account}
              onChange={handleChange}
            />

            <Textarea
              label="Catatan (Opsional)"
              name="notes"
              placeholder="Tambahkan catatan atau keterangan tambahan..."
              rows={4}
              value={formData.notes}
              onChange={handleChange}
            />

            <div className="flex items-center gap-3 pt-4 border-t border-[#EBE5DC]">
              <Button type="submit" isLoading={isUpdating} disabled={isUpdating}>
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
