"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Select } from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { dataIntakeApi } from "../api/data-intake-api";
import { useLoans } from "../hooks/use-data-intake";
import type { Loan, LoanPayload } from "../types";
import { getErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Landmark, Plus } from "lucide-react";

const today = () => new Date().toISOString().split("T")[0];

type LoanForm = Omit<LoanPayload, "term_months"> & { term_months: string };

const emptyForm = (): LoanForm => ({
  lender: "",
  loan_type: "term_loan",
  principal: "",
  interest_rate: "0",
  term_months: "12",
  start_date: today(),
  outstanding_principal: "",
  monthly_installment: "",
  status: "active",
});

export function LoansTab() {
  const queryClient = useQueryClient();
  const query = useLoans();
  const [form, setForm] = useState<LoanForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const saveMutation = useMutation({
    mutationFn: (payload: LoanPayload) =>
      editingId
        ? dataIntakeApi.updateLoan(editingId, payload)
        : dataIntakeApi.createLoan(payload),
    onMutate: () => {
      setError("");
      setSuccess("");
    },
    onSuccess: async () => {
      setSuccess(editingId ? "Pinjaman diperbarui." : "Pinjaman ditambahkan.");
      setForm(emptyForm());
      setEditingId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["loans"] }),
        queryClient.invalidateQueries({ queryKey: ["ratios"] }),
      ]);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const edit = (row: Loan) => {
    setEditingId(row.id);
    setForm({
      lender: row.lender,
      loan_type: row.loan_type,
      principal: row.principal,
      interest_rate: row.interest_rate,
      term_months: String(row.term_months),
      start_date: row.start_date,
      outstanding_principal: row.outstanding_principal,
      monthly_installment: row.monthly_installment ?? "",
      status: row.status,
    });
    setError("");
    setSuccess("");
  };

  const submit = () => {
    if (!form.lender.trim()) {
      setError("Nama pemberi pinjaman wajib diisi.");
      return;
    }
    if (!form.principal || Number(form.principal) <= 0) {
      setError("Pokok pinjaman harus lebih dari 0.");
      return;
    }
    const term = Number(form.term_months);
    if (!term || term < 1) {
      setError("Tenor minimal 1 bulan.");
      return;
    }
    saveMutation.mutate({
      ...form,
      lender: form.lender.trim(),
      term_months: term,
      monthly_installment: form.monthly_installment?.trim() || null,
    });
  };

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="rounded-xl border border-[#EBE5DC] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-[#1F241D]">
            {editingId ? "Edit pinjaman" : "Tambah pinjaman"}
          </h3>
          {editingId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
              }}
            >
              Batal edit
            </Button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-[#666A61]">Pemberi pinjaman</label>
            <Input
              value={form.lender}
              onChange={(e) => setForm({ ...form, lender: e.target.value })}
              placeholder="Bank / koperasi"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Jenis</label>
            <Select
              value={form.loan_type}
              options={[
                { value: "short_term", label: "Jangka pendek" },
                { value: "term_loan", label: "Pinjaman berjangka" },
              ]}
              onChange={(e) =>
                setForm({ ...form, loan_type: e.target.value as LoanPayload["loan_type"] })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Tanggal mulai</label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Pokok pinjaman</label>
            <Input
              type="number"
              step="0.01"
              value={form.principal}
              onChange={(e) => setForm({ ...form, principal: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Sisa pokok</label>
            <Input
              type="number"
              step="0.01"
              value={form.outstanding_principal}
              onChange={(e) =>
                setForm({ ...form, outstanding_principal: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Bunga (% / tahun)</label>
            <Input
              type="number"
              step="0.0001"
              value={form.interest_rate}
              onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Tenor (bulan)</label>
            <Input
              type="number"
              value={form.term_months}
              onChange={(e) => setForm({ ...form, term_months: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Cicilan / bulan</label>
            <Input
              type="number"
              step="0.01"
              value={form.monthly_installment ?? ""}
              onChange={(e) =>
                setForm({ ...form, monthly_installment: e.target.value })
              }
              placeholder="Opsional"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Status</label>
            <Select
              value={form.status}
              options={[
                { value: "active", label: "Aktif" },
                { value: "paid", label: "Lunas" },
                { value: "defaulted", label: "Gagal bayar" },
              ]}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as LoanPayload["status"] })
              }
            />
          </div>
        </div>
        <Button
          className="mt-3"
          onClick={submit}
          isLoading={saveMutation.isPending}
          disabled={saveMutation.isPending}
        >
          <Plus className="w-4 h-4" />
          {editingId ? "Simpan perubahan" : "Tambah pinjaman"}
        </Button>
      </div>

      {query.isLoading ? (
        <LoadingSpinner />
      ) : query.isError ? (
        <Alert variant="error">{getErrorMessage(query.error)}</Alert>
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Belum ada pinjaman"
          description="Tambahkan pinjaman agar proyeksi utang dan rasio solvabilitas lebih lengkap."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#EBE5DC]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pemberi</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Mulai</TableHead>
                <TableHead className="text-right">Pokok</TableHead>
                <TableHead className="text-right">Sisa pokok</TableHead>
                <TableHead className="text-right">Bunga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(query.data ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.lender}</TableCell>
                  <TableCell>{row.loan_type}</TableCell>
                  <TableCell>{formatDate(row.start_date)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.principal)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.outstanding_principal)}
                  </TableCell>
                  <TableCell className="text-right">{row.interest_rate}%</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "active"
                          ? "success"
                          : row.status === "defaulted"
                            ? "error"
                            : "default"
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => edit(row)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
