"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
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
import { useInventoryItems } from "../hooks/use-data-intake";
import type {
  InventoryItem,
  InventoryItemPayload,
  InventoryMovementPayload,
} from "../types";
import { getErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Boxes, PackagePlus, Plus } from "lucide-react";

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = (): InventoryItemPayload => ({
  sku: "",
  name: "",
  unit: "pcs",
  cost_price: "0",
  quantity_on_hand: "0",
  reorder_point: "0",
  is_active: true,
});

export function InventoryTab() {
  const queryClient = useQueryClient();
  const query = useInventoryItems();
  const [form, setForm] = useState<InventoryItemPayload>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
  const [movement, setMovement] = useState<InventoryMovementPayload>({
    movement_date: today(),
    movement_type: "in",
    quantity: "1",
    reference: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const saveMutation = useMutation({
    mutationFn: (payload: InventoryItemPayload) =>
      editingId
        ? dataIntakeApi.updateInventoryItem(editingId, {
            name: payload.name,
            unit: payload.unit,
            cost_price: payload.cost_price,
            quantity_on_hand: payload.quantity_on_hand,
            reorder_point: payload.reorder_point,
            is_active: payload.is_active,
          })
        : dataIntakeApi.createInventoryItem(payload),
    onMutate: () => {
      setError("");
      setSuccess("");
    },
    onSuccess: async () => {
      setSuccess(editingId ? "Item persediaan diperbarui." : "Item persediaan ditambahkan.");
      setForm(emptyForm());
      setEditingId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] }),
        queryClient.invalidateQueries({ queryKey: ["ratios"] }),
      ]);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const movementMutation = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: InventoryMovementPayload }) =>
      dataIntakeApi.createInventoryMovement(itemId, payload),
    onMutate: () => {
      setError("");
      setSuccess("");
    },
    onSuccess: async () => {
      setSuccess("Mutasi persediaan tersimpan dan stok diperbarui.");
      setMovementItem(null);
      setMovement({
        movement_date: today(),
        movement_type: "in",
        quantity: "1",
        reference: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const edit = (row: InventoryItem) => {
    setEditingId(row.id);
    setForm({
      sku: row.sku,
      name: row.name,
      unit: row.unit,
      cost_price: row.cost_price,
      quantity_on_hand: row.quantity_on_hand,
      reorder_point: row.reorder_point ?? "0",
      is_active: row.is_active,
    });
    setError("");
    setSuccess("");
  };

  const submit = () => {
    if (!form.sku.trim() || !form.name.trim()) {
      setError("SKU dan nama item wajib diisi.");
      return;
    }
    saveMutation.mutate({
      ...form,
      sku: form.sku.trim(),
      name: form.name.trim(),
      unit: form.unit.trim() || "pcs",
      reorder_point: form.reorder_point?.trim() || null,
    });
  };

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="rounded-xl border border-[#EBE5DC] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-[#1F241D]">
            {editingId ? "Edit item persediaan" : "Tambah item persediaan"}
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
            <label className="text-xs font-medium text-[#666A61]">SKU</label>
            <Input
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="KOPI-001"
              disabled={editingId !== null}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Nama item</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Kopi Arabika"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Satuan</label>
            <Input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="kg / pcs"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Harga pokok / unit</label>
            <Input
              type="number"
              step="0.01"
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Stok saat ini</label>
            <Input
              type="number"
              step="0.0001"
              value={form.quantity_on_hand}
              onChange={(e) => setForm({ ...form, quantity_on_hand: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Titik reorder</label>
            <Input
              type="number"
              step="0.0001"
              value={form.reorder_point ?? "0"}
              onChange={(e) => setForm({ ...form, reorder_point: e.target.value })}
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
          {editingId ? "Simpan perubahan" : "Tambah item"}
        </Button>
      </div>

      {query.isLoading ? (
        <LoadingSpinner />
      ) : query.isError ? (
        <Alert variant="error">{getErrorMessage(query.error)}</Alert>
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Belum ada persediaan"
          description="Tambahkan item persediaan agar nilai persediaan dan inventory turnover dapat dihitung."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#EBE5DC]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead className="text-right">Harga pokok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(query.data ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell className="text-right">
                    {row.quantity_on_hand} {row.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.cost_price)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={row.is_active ? "success" : "default"}>
                        {row.is_active ? "aktif" : "nonaktif"}
                      </Badge>
                      {row.is_low_stock && <Badge variant="warning">low stock</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => edit(row)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setMovementItem(row);
                          setMovement({
                            movement_date: today(),
                            movement_type: "in",
                            quantity: "1",
                            reference: "",
                          });
                        }}
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        Mutasi
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal
        isOpen={movementItem !== null}
        onClose={() => setMovementItem(null)}
        title={`Mutasi ${movementItem?.name ?? ""}`}
        description={`Stok saat ini: ${movementItem?.quantity_on_hand ?? "-"} ${movementItem?.unit ?? ""}`}
        size="sm"
      >
        <div className="space-y-3 p-5">
          <div>
            <label className="text-xs font-medium text-[#666A61]">Tanggal</label>
            <Input
              type="date"
              value={movement.movement_date}
              onChange={(e) => setMovement({ ...movement, movement_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Jenis mutasi</label>
            <Select
              value={movement.movement_type}
              options={[
                { value: "in", label: "Masuk" },
                { value: "out", label: "Keluar" },
                { value: "adjustment", label: "Adjustment (+/-)" },
              ]}
              onChange={(e) =>
                setMovement({
                  ...movement,
                  movement_type: e.target.value as InventoryMovementPayload["movement_type"],
                })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Jumlah</label>
            <Input
              type="number"
              step="0.0001"
              value={movement.quantity}
              onChange={(e) => setMovement({ ...movement, quantity: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666A61]">Referensi</label>
            <Input
              value={movement.reference ?? ""}
              onChange={(e) => setMovement({ ...movement, reference: e.target.value })}
              placeholder="Opsional"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => {
              if (!movementItem) return;
              movementMutation.mutate({
                itemId: movementItem.id,
                payload: movement,
              });
            }}
            isLoading={movementMutation.isPending}
          >
            Simpan mutasi
          </Button>
        </div>
      </Modal>
    </div>
  );
}
