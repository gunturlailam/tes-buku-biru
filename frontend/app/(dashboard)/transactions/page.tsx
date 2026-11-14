"use client";

import { useState, useMemo } from "react";
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
import { Plus, Search, Filter, Receipt, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTransactions } from "@/hooks/use-transactions";

const typeOptions = [
  { value: "all", label: "Semua Tipe" },
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
];

const categoryOptions = [
  { value: "all", label: "Semua Kategori" },
  { value: "Penjualan", label: "Penjualan" },
  { value: "Pembelian", label: "Pembelian" },
  { value: "Operasional", label: "Operasional" },
  { value: "Gaji", label: "Gaji" },
];

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const { data: transactions = [], isLoading, error } = useTransactions();

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction: any) => {
      const matchesSearch = (transaction.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType =
        typeFilter === "all" || transaction.tx_type === typeFilter;
      const matchesCategory =
        categoryFilter === "all";

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchQuery, typeFilter, categoryFilter]);

  return (
    <div className="space-y-6">
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

      {/* Error State */}
      {error && (
        <div className="bg-red-50 rounded-2xl border border-red-200 shadow-[0_2px_16px_rgba(239,68,68,0.1)] p-6">
          <p className="text-red-700 font-medium">Gagal memuat transaksi</p>
          <p className="text-red-600 text-sm mt-1">
            {error instanceof Error ? error.message : "Terjadi kesalahan"}
          </p>
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
                {filteredTransactions.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          transaction.tx_type === "income"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {transaction.tx_type === "income"
                          ? "Pemasukan"
                          : "Pengeluaran"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <span
                        className={
                          transaction.tx_type === "income"
                            ? "text-emerald-700"
                            : "text-red-700"
                        }
                      >
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/transactions/${transaction.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
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
