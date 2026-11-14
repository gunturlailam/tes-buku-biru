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
import { useFixedAssets } from "../hooks/use-data-intake";
import type { FixedAsset, FixedAssetPayload } from "../types";
import { getErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Building2, Plus } from "lucide-react";

const today = () => new Date().toISOString().split("T")[0];

type AssetForm = Omit<FixedAssetPayload, "useful_life_months"> & {
  useful_life_months: string;
};

const emptyForm = (): AssetForm => ({
  name: "",
  asset_category: "",
  acquisition_date: today(),
  acquisition_cost: "",
  accumulated_depreciation: "0",
  useful_life_months: "",
  salvage_value: "0",
  status: "active",
});

export function FixedAssetsTab() {
  const queryClient = useQueryClient();
  const query = useFixedAssets();
  const [form, setForm] = useState<AssetForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const saveMutation = useMutation({
    mutationFn: (payload: FixedAssetPayload) =>
      editingId
        ? dataIntakeApi.updateFixedAsset(editingId, payload)
        : dataIntakeApi.createFixedAsset(payload),
    onMutate: () => {
      setError("");
      setSuccess("");
    },
    onSuccess: async () => {
      setSuccess(editingId ? "Aset tetap diperbarui." : "Aset tetap ditambahkan.");
      setForm(emptyForm());
      setEditingId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fixed-assets"] }),
        queryClient.invalidateQueries({ queryKey: ["ratios"] }),
      ]);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const edit = (row: FixedAsset) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      asset_category: row.asset_category ?? "",
      acquisition_date: row.acquisition_date,
      acquisition_cost: row.acquisition_cost,
      accumulated_depreciation: row.accumulated_depreciation,
      useful_life_months: row.useful_life_months ? String(row.useful_life_months) : "",
      salvage_value: row.salvage_value,
      status: row.status,
    });
    setError("");
    setSuccess("");
  };

  const submit = () => {
    if (!form.name.trim()) {
      setError("Nama aset wajib diisi.");
      return;
    }
    if (!form.acquisition_cost || Number(form.acquisition_cost) <= 0) {
      setError("Harga perolehan harus lebih dari 0.");
      return;
    }
    const months = form.useful_life_months
      ? Number(form.useful_life_months)
      : null;
    saveMutation.mutate({
      ...form,
      name: form.name.trim(),
      asset_category: form.asset_category?.trim() || null,
      useful_life_months: months && months > 0 ? months : null,
    });
  };

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="rounded-xl border border-[#EBE5DC] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-[#1F241D]">
            {editingId ? "Edit aset tetap" : "Tambah aset tetap"}
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
            <label className="text-xs font-medium text-[#666A61]">Nama aset</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Mesin espresso"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Kategori</label>
            <Input
              value={form.asset_category ?? ""}
              onChange={(e) => setForm({ ...form, asset_category: e.target.value })}
              placeholder="Peralatan"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Tanggal perolehan</label>
            <Input
              type="date"
              value={form.acquisition_date}
              onChange={(e) => setForm({ ...form, acquisition_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Harga perolehan</label>
            <Input
              type="number"
              step="0.01"
              value={form.acquisition_cost}
              onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">
              Akumulasi penyusutan
            </label>
            <Input
              type="number"
              step="0.01"
              value={form.accumulated_depreciation}
              onChange={(e) =>
                setForm({ ...form, accumulated_depreciation: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">
              Umur manfaat (bulan)
            </label>
            <Input
              type="number"
              value={form.useful_life_months}
              onChange={(e) => setForm({ ...form, useful_life_months: e.target.value })}
              placeholder="Opsional"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Nilai residu</label>
            <Input
              type="number"
              step="0.01"
              value={form.salvage_value}
              onChange={(e) => setForm({ ...form, salvage_value: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Status</label>
            <Select
              value={form.status}
              options={[
                { value: "active", label: "Aktif" },
                { value: "disposed", label: "Dilepas" },
              ]}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as FixedAssetPayload["status"] })
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
          {editingId ? "Simpan perubahan" : "Tambah aset"}
        </Button>
      </div>

      {query.isLoading ? (
        <LoadingSpinner />
      ) : query.isError ? (
        <Alert variant="error">{getErrorMessage(query.error)}</Alert>
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Belum ada aset tetap"
          description="Tambahkan aset tetap untuk melengkapi nilai aset pada neraca."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#EBE5DC]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Perolehan</TableHead>
                <TableHead className="text-right">Harga perolehan</TableHead>
                <TableHead className="text-right">Nilai buku</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(query.data ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.asset_category ?? "-"}</TableCell>
                  <TableCell>{formatDate(row.acquisition_date)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.acquisition_cost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.book_value)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === "active" ? "success" : "default"}>
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
