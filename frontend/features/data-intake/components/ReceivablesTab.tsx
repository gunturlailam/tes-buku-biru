"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { dataIntakeApi } from "../api/data-intake-api";
import { useReceivables } from "../hooks/use-data-intake";
import type { Receivable, ReceivablePayload } from "../types";
import { getErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle2, Plus, Wallet } from "lucide-react";

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = (): ReceivablePayload => ({
  customer_name: "",
  invoice_number: "",
  invoice_date: today(),
  due_date: today(),
  amount: "",
  paid_amount: "0",
});

export function ReceivablesTab() {
  const queryClient = useQueryClient();
  const query = useReceivables();
  const [form, setForm] = useState<ReceivablePayload>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const saveMutation = useMutation({
    mutationFn: (payload: ReceivablePayload) =>
      editingId
        ? dataIntakeApi.updateReceivable(editingId, payload)
        : dataIntakeApi.createReceivable(payload),
    onMutate: () => {
      setError("");
      setSuccess("");
    },
    onSuccess: async () => {
      setSuccess(editingId ? "Piutang diperbarui." : "Piutang ditambahkan.");
      setForm(emptyForm());
      setEditingId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["receivables"] }),
        queryClient.invalidateQueries({ queryKey: ["ratios"] }),
      ]);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const markPaidMutation = useMutation({
    mutationFn: (row: Receivable) =>
      dataIntakeApi.updateReceivable(row.id, {
        paid_amount: row.amount,
      }),
    onSuccess: async () => {
      setSuccess("Piutang ditandai lunas.");
      await queryClient.invalidateQueries({ queryKey: ["receivables"] });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const edit = (row: Receivable) => {
    setEditingId(row.id);
    setForm({
      customer_name: row.customer_name,
      invoice_number: row.invoice_number ?? "",
      invoice_date: row.invoice_date,
      due_date: row.due_date,
      amount: row.amount,
      paid_amount: row.paid_amount,
    });
    setError("");
    setSuccess("");
  };

  const submit = () => {
    if (!form.customer_name.trim()) {
      setError("Nama pelanggan wajib diisi.");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError("Nilai piutang harus lebih dari 0.");
      return;
    }
    saveMutation.mutate({
      ...form,
      customer_name: form.customer_name.trim(),
      invoice_number: form.invoice_number?.trim() || null,
    });
  };

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="rounded-xl border border-[#EBE5DC] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-[#1F241D]">
            {editingId ? "Edit piutang" : "Tambah piutang"}
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
            <label className="text-xs font-medium text-[#666A61]">Pelanggan</label>
            <Input
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              placeholder="Nama pelanggan"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">No. invoice</label>
            <Input
              value={form.invoice_number ?? ""}
              onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
              placeholder="Opsional"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Jatuh tempo</label>
            <Input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Tanggal invoice</label>
            <Input
              type="date"
              value={form.invoice_date}
              onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Nilai piutang</label>
            <Input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Sudah dibayar</label>
            <Input
              type="number"
              step="0.01"
              value={form.paid_amount}
              onChange={(e) => setForm({ ...form, paid_amount: e.target.value })}
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
          {editingId ? "Simpan perubahan" : "Tambah piutang"}
        </Button>
      </div>

      {query.isLoading ? (
        <LoadingSpinner />
      ) : query.isError ? (
        <Alert variant="error">{getErrorMessage(query.error)}</Alert>
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Belum ada piutang"
          description="Tambahkan piutang usaha agar arus kas dan aging piutang dapat dianalisis."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#EBE5DC]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Jatuh tempo</TableHead>
                <TableHead className="text-right">Nilai</TableHead>
                <TableHead className="text-right">Sisa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(query.data ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.customer_name}</TableCell>
                  <TableCell>{row.invoice_number ?? "-"}</TableCell>
                  <TableCell>{formatDate(row.due_date)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.outstanding_amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "paid"
                          ? "success"
                          : row.status === "overdue"
                            ? "error"
                            : row.status === "partial"
                              ? "warning"
                              : "info"
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => edit(row)}>
                        Edit
                      </Button>
                      {row.status !== "paid" && row.status !== "written_off" && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => markPaidMutation.mutate(row)}
                          isLoading={markPaidMutation.isPending}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Lunas
                        </Button>
                      )}
                    </div>
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
