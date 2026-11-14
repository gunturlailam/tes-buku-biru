"use client";

import { useState, useMemo, Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

import { Plus, Search, Receipt, Pencil, RotateCcw } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  useTransactions,
  useReverseTransaction,
} from "@/hooks/use-transactions";
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

interface TransactionRow {
  id: number;
  transaction_date?: string;
  date?: string;
  description: string;
  amount: string | number;
  tx_type: string;
  category_id?: number | null;
  status?: string;
  reversal_of_id?: number | null;
}

const typeOptions = [
  { value: "all", label: "Semua Tipe" },
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
  { value: "transfer", label: "Transfer" },
  { value: "owner_contribution", label: "Setoran Modal" },
  { value: "owner_draw", label: "Penarikan Pemilik" },
  { value: "loan_received", label: "Pinjaman Masuk" },
  { value: "loan_repayment", label: "Cicilan Pinjaman" },
  { value: "refund", label: "Refund" },
];

const typeLabels: Record<string, string> = {
  income: "Pemasukan",
  expense: "Pengeluaran",
  transfer: "Transfer",
  owner_contribution: "Setoran Modal",
  owner_draw: "Penarikan Pemilik",
  loan_received: "Pinjaman Masuk",
  loan_repayment: "Cicilan Pinjaman",
  refund: "Refund",
};

function TransactionsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [toast, setToast] = useState<Toast | null>(null);
  const [reversingId, setReversingId] = useState<number | null>(null);

  const { data: categories = [] } = useCategories();
  const categoryOptions = [
    { value: "all", label: "Semua Kategori" },
    ...(categories as CategoryOption[]).map((category) => ({
      value: String(category.id),
      label: category.name,
    })),
  ];

  const {
    data: transactionsData = [],
    isLoading,
    error,
  } = useTransactions({
    tx_type: typeFilter === "all" ? undefined : typeFilter,
    category_id:
      categoryFilter === "all" ? undefined : Number(categoryFilter),
  });
  const transactions = transactionsData as TransactionRow[];
  const { mutate: reverseTransaction, isPending: isReversing } =
    useReverseTransaction();

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch = (transaction.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType =
        typeFilter === "all" || transaction.tx_type === typeFilter;
      const matchesCategory =
        categoryFilter === "all" ||
        String(transaction.category_id ?? "") === categoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchQuery, typeFilter, categoryFilter]);

  const handleReverse = (id: number) => {
    if (
      window.confirm(
        "Batalkan transaksi ini? Transaksi tidak dihapus permanen; sistem membuat baris reversal agar jejak audit tetap utuh."
      )
    ) {
      setReversingId(id);
      reverseTransaction(id, {
        onSuccess: () => {
          setReversingId(null);
          setToast({
            type: "success",
            message: "Transaksi berhasil dibatalkan (reversal)",
          });
          setTimeout(() => setToast(null), 3000);
        },
        onError: (error) => {
          setReversingId(null);
          const errorMessage = getErrorMessage(error);
          setToast({
            type: "error",
            message: errorMessage || "Gagal membatalkan transaksi",
          });
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg text-sm font-medium z-50 ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F241D]">Transaksi</h1>
          <p className="text-sm text-[#7E8379] mt-1">
            Kelola semua transaksi keuangan usaha Anda
          </p>
        </div>
        <Link href="/transactions/new">
          <Button>
            <Plus className="w-4 h-4" />
            Tambah Transaksi
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8379]" />
              <Input
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] p-12 text-center">
          <p className="text-[#7E8379]">Memuat transaksi...</p>
        </div>
      )}

      {/* Error State - with detailed error info */}
      {error && (
        <div className="bg-red-50 rounded-2xl border border-red-200 shadow-[0_2px_16px_rgba(239,68,68,0.1)] p-6 space-y-3">
          <div>
            <p className="text-red-700 font-medium">Gagal memuat transaksi</p>
            <p className="text-red-600 text-sm mt-1">
              {error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui"}
            </p>
          </div>
          {error instanceof Error && error.message.includes("422") && (
            <div className="bg-red-100 p-3 rounded border border-red-300 text-xs text-red-800">
              <p className="font-medium mb-1">Penyebab: Invalid request format</p>
              <p>Mohon refresh halaman atau coba beberapa saat lagi</p>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-2xl border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] overflow-hidden">
          {filteredTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {formatDate(
                        transaction.transaction_date || transaction.date || "",
                      )}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            transaction.tx_type === "income"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : transaction.tx_type === "expense"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-slate-50 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {typeLabels[transaction.tx_type] ||
                            transaction.tx_type}
                        </span>
                        {transaction.status === "reversed" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Dibatalkan
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <span
                        className={
                          transaction.tx_type === "income"
                            ? "text-emerald-700"
                            : transaction.tx_type === "expense"
                              ? "text-red-700"
                              : "text-slate-700"
                        }
                      >
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {transaction.status !== "reversed" &&
                          !transaction.reversal_of_id && (
                            <>
                              <Link
                                href={`/transactions/${transaction.id}/edit`}
                              >
                                <Button variant="ghost" size="sm">
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Batalkan (reversal)"
                                onClick={() => handleReverse(transaction.id)}
                                disabled={
                                  isReversing && reversingId === transaction.id
                                }
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Receipt}
              title="Tidak ada transaksi"
              description="Belum ada transaksi yang sesuai dengan filter Anda. Coba ubah filter atau tambah transaksi baru."
              action={
                <Link href="/transactions/new">
                  <Button>
                    <Plus className="w-4 h-4" />
                    Tambah Transaksi
                  </Button>
                </Link>
              }
            />
          )}
        </div>
      )}

      {/* Pagination - placeholder */}
      {!isLoading && filteredTransactions.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-[#7E8379]">
            Menampilkan {filteredTransactions.length} dari{" "}
            {transactions.length} transaksi
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled>
              Sebelumnya
            </Button>
            <Button variant="secondary" size="sm" disabled>
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}
