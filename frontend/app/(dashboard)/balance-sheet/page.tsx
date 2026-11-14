"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
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
import { dataIntakeApi } from "@/features/data-intake/api/data-intake-api";
import {
  useAccountingPeriods,
  useAccounts,
  useBalanceSnapshots,
} from "@/features/data-intake/hooks/use-data-intake";
import type {
  Account,
  AccountingPeriod,
  BalanceSnapshot,
  BalanceSnapshotPayload,
} from "@/features/data-intake/types";
import { getErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle2, Lock, RefreshCw, Save, Unlock } from "lucide-react";

const BALANCE_TYPES: Account["account_type"][] = ["asset", "liability", "equity"];

const typeLabels: Record<string, string> = {
  asset: "Aset",
  liability: "Liabilitas",
  equity: "Ekuitas",
};

const today = () => new Date().toISOString().split("T")[0];

const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const monthEnd = () => {
  const d = new Date();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(
    end.getDate(),
  ).padStart(2, "0")}`;
};

export default function BalanceSheetPage() {
  const queryClient = useQueryClient();
  const accountsQuery = useAccounts();
  const snapshotsQuery = useBalanceSnapshots();
  const periodsQuery = useAccountingPeriods();

  const [asOfDate, setAsOfDate] = useState(today());
  const [statusOverride, setStatusOverride] = useState<"draft" | "final" | null>(null);
  const [notesOverride, setNotesOverride] = useState<string | null>(null);
  const [amountOverrides, setAmountOverrides] = useState<Record<number, string>>({});
  const [savedSnapshot, setSavedSnapshot] = useState<BalanceSnapshot | null>(null);
  const [periodFrom, setPeriodFrom] = useState(monthStart());
  const [periodTo, setPeriodTo] = useState(monthEnd());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const balanceAccounts = useMemo(
    () =>
      (accountsQuery.data ?? [])
        .filter(
          (account) =>
            BALANCE_TYPES.includes(account.account_type) && account.is_active,
        )
        .sort((a, b) => a.code.localeCompare(b.code)),
    [accountsQuery.data],
  );

  const groupedAccounts = useMemo(
    () =>
      BALANCE_TYPES.map((type) => ({
        type,
        label: typeLabels[type],
        accounts: balanceAccounts.filter((account) => account.account_type === type),
      })),
    [balanceAccounts],
  );

  const querySnapshot = useMemo(
    () =>
      (snapshotsQuery.data ?? []).find((row) => row.as_of_date === asOfDate) ??
      null,
    [asOfDate, snapshotsQuery.data],
  );
  const snapshot =
    savedSnapshot?.as_of_date === asOfDate ? savedSnapshot : querySnapshot;
  const status = statusOverride ?? snapshot?.status ?? "draft";
  const notes = notesOverride ?? snapshot?.notes ?? "";

  const amountFor = (accountId: number) =>
    amountOverrides[accountId] ??
    snapshot?.lines.find((line) => line.account_id === accountId)?.amount ??
    "0";

  const resetDraft = (nextDate?: string) => {
    if (nextDate !== undefined) setAsOfDate(nextDate);
    setAmountOverrides({});
    setStatusOverride(null);
    setNotesOverride(null);
    setSavedSnapshot(null);
  };

  const totalFor = (type: Account["account_type"]) =>
    balanceAccounts
      .filter((account) => account.account_type === type)
      .reduce((sum, account) => sum + Number(amountFor(account.id) || 0), 0);

  const totalAssets = totalFor("asset");
  const totalLiabilities = totalFor("liability");
  const totalEquity = totalFor("equity");
  const isBalanced =
    Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

  const saveMutation = useMutation({
    mutationFn: (payload: BalanceSnapshotPayload) =>
      dataIntakeApi.upsertBalanceSnapshot(payload),
    onMutate: () => {
      setError("");
      setSuccess("");
    },
    onSuccess: async (data) => {
      setSavedSnapshot(data);
      setAmountOverrides({});
      setStatusOverride(null);
      setNotesOverride(null);
      setSuccess(
        `Neraca ${formatDate(data.as_of_date)} tersimpan sebagai ${data.status}.`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["balance-snapshots"] }),
        queryClient.invalidateQueries({ queryKey: ["balance-sheet"] }),
        queryClient.invalidateQueries({ queryKey: ["ratios"] }),
      ]);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      nextStatus,
    }: {
      id: number;
      nextStatus: "draft" | "final";
    }) => dataIntakeApi.updateBalanceSnapshot(id, { status: nextStatus }),
    onSuccess: async (data) => {
      setSavedSnapshot(data);
      setStatusOverride(null);
      setSuccess(`Status snapshot diubah menjadi ${data.status}.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["balance-snapshots"] }),
        queryClient.invalidateQueries({ queryKey: ["balance-sheet"] }),
        queryClient.invalidateQueries({ queryKey: ["ratios"] }),
      ]);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const createPeriodMutation = useMutation({
    mutationFn: () => dataIntakeApi.createPeriod(periodFrom, periodTo),
    onMutate: () => {
      setError("");
      setSuccess("");
    },
    onSuccess: async (period) => {
      setSuccess(
        `Periode ${formatDate(period.period_from)} – ${formatDate(period.period_to)} dibuat.`,
      );
      await queryClient.invalidateQueries({ queryKey: ["accounting-periods"] });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const periodActionMutation = useMutation({
    mutationFn: ({
      period,
      action,
    }: {
      period: AccountingPeriod;
      action: "close" | "reopen";
    }) =>
      action === "close"
        ? dataIntakeApi.closePeriod(period.id)
        : dataIntakeApi.reopenPeriod(period.id),
    onMutate: () => {
      setError("");
      setSuccess("");
    },
    onSuccess: async (period) => {
      setSuccess(
        `Periode ${formatDate(period.period_from)} – ${formatDate(period.period_to)} ${
          period.status === "closed" ? "ditutup" : "dibuka kembali"
        }.`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["accounting-periods"] }),
        queryClient.invalidateQueries({ queryKey: ["balance-snapshots"] }),
      ]);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleSave = () => {
    if (!asOfDate) {
      setError("Tanggal neraca wajib diisi.");
      return;
    }
    if (balanceAccounts.length === 0) {
      setError("Belum ada akun aset/liabilitas/ekuitas. Buat akun terlebih dahulu.");
      return;
    }
    saveMutation.mutate({
      as_of_date: asOfDate,
      status,
      notes: notes.trim() || null,
      lines: balanceAccounts.map((account) => ({
        account_id: account.id,
        amount: amountFor(account.id),
      })),
    });
  };

  const handleLoadSnapshot = (row: BalanceSnapshot) => {
    resetDraft(row.as_of_date);
    setSavedSnapshot(row);
    setError("");
    setSuccess("");
  };

  const loading =
    accountsQuery.isLoading || snapshotsQuery.isLoading || periodsQuery.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-semibold text-[#1F241D]">
          Neraca & Periode
        </h1>
        <p className="text-sm text-[#7E8379] mt-1">
          Masukkan saldo akun per tanggal. Snapshot final dipakai engine rasio
          untuk likuiditas, solvabilitas, ROA, dan ROE.
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Gagal menyimpan">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" title="Berhasil">
          {success}
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : accountsQuery.isError ? (
        <Alert variant="error" title="Akun gagal dimuat">
          {getErrorMessage(accountsQuery.error)}
        </Alert>
      ) : balanceAccounts.length === 0 ? (
        <Card>
          <CardContent className="pt-5">
            <EmptyState
              icon={Save}
              title="Belum ada akun neraca"
              description="Tambahkan akun bertipe aset, liabilitas, atau ekuitas terlebih dahulu agar neraca bisa diisi."
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Input saldo akun</CardTitle>
                <CardDescription>
                  Semua nominal dalam Rupiah. Backend memvalidasi tenant, akun,
                  dan periode tutup buku.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs font-medium text-[#666A61]">
                    Tanggal neraca
                  </label>
                  <Input
                    type="date"
                    value={asOfDate}
                    onChange={(event) => resetDraft(event.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#666A61]">
                    Status
                  </label>
                  <Select
                    value={status}
                    options={[
                      { value: "draft", label: "Draft" },
                      { value: "final", label: "Final" },
                    ]}
                    onChange={(event) =>
                      setStatusOverride(event.target.value as "draft" | "final")
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {groupedAccounts.map((group) => (
              <div key={group.type}>
                <h3 className="text-sm font-semibold text-[#1F241D] mb-2">
                  {group.label}
                </h3>
                <div className="overflow-x-auto rounded-xl border border-[#EBE5DC]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama akun</TableHead>
                        <TableHead className="w-48 text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.accounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-mono text-xs">
                            {account.code}
                          </TableCell>
                          <TableCell>{account.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={amountFor(account.id)}
                              onChange={(event) =>
                                setAmountOverrides((prev) => ({
                                  ...prev,
                                  [account.id]: event.target.value,
                                }))
                              }
                              className="text-right"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}

            <div>
              <label className="text-xs font-medium text-[#666A61]">
                Catatan (opsional)
              </label>
              <Input
                value={notes}
                onChange={(event) => setNotesOverride(event.target.value)}
                placeholder="Contoh: saldo per akhir Januari 2026"
                className="mt-1"
              />
            </div>

            <div className="rounded-xl bg-[#FAF7F2] p-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <span className="text-[#7E8379]">Total aset</span>
                  <p className="font-semibold">{formatCurrency(totalAssets)}</p>
                </div>
                <div>
                  <span className="text-[#7E8379]">Total liabilitas</span>
                  <p className="font-semibold">{formatCurrency(totalLiabilities)}</p>
                </div>
                <div>
                  <span className="text-[#7E8379]">Total ekuitas</span>
                  <p className="font-semibold">{formatCurrency(totalEquity)}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#7E8379]">
                Pemeriksaan tampilan sementara:{" "}
                <span className={isBalanced ? "text-emerald-700" : "text-amber-700"}>
                  {isBalanced ? "aset = liabilitas + ekuitas" : "belum seimbang"}
                </span>
                . Backend tetap menjadi sumber kebenaran.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#7E8379]">
                {snapshot
                  ? `Snapshot tersimpan #${snapshot.id} · ${snapshot.status}`
                  : "Belum ada snapshot pada tanggal ini."}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => resetDraft(today())}
                >
                  <RefreshCw className="w-4 h-4" />
                  Tanggal hari ini
                </Button>
                <Button
                  onClick={handleSave}
                  isLoading={saveMutation.isPending}
                  disabled={saveMutation.isPending}
                >
                  <Save className="w-4 h-4" />
                  Simpan Neraca
                </Button>
              </div>
            </div>

            {snapshot && (
              <div className="rounded-xl border border-[#EBE5DC] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={snapshot.status === "final" ? "success" : "warning"}>
                    {snapshot.status}
                  </Badge>
                  <Badge variant={snapshot.is_balanced ? "success" : "warning"}>
                    {snapshot.is_balanced ? "Seimbang" : "Belum seimbang"}
                  </Badge>
                  {snapshot.warnings.map((warning) => (
                    <Badge key={warning} variant="info">
                      {warning}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <p>Aset: {formatCurrency(snapshot.totals.total_assets)}</p>
                  <p>
                    Liabilitas: {formatCurrency(snapshot.totals.total_liabilities)}
                  </p>
                  <p>Ekuitas: {formatCurrency(snapshot.totals.total_equity)}</p>
                </div>
                {snapshot.status === "draft" && (
                  <Button
                    size="sm"
                    variant="success"
                    className="mt-3"
                    onClick={() =>
                      statusMutation.mutate({ id: snapshot.id, nextStatus: "final" })
                    }
                    isLoading={statusMutation.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Finalkan snapshot
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Snapshot tersimpan</CardTitle>
            <CardDescription>
              Pilih snapshot untuk dimuat kembali ke form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshotsQuery.isLoading ? (
              <LoadingSpinner />
            ) : (snapshotsQuery.data ?? []).length === 0 ? (
              <EmptyState
                icon={Save}
                title="Belum ada snapshot"
                description="Simpan neraca pertama Anda untuk melihat daftar di sini."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aset</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(snapshotsQuery.data ?? []).slice(0, 12).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{formatDate(row.as_of_date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={row.status === "final" ? "success" : "warning"}
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.totals.total_assets)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleLoadSnapshot(row)}
                          >
                            Muat
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Periode akuntansi</CardTitle>
            <CardDescription>
              Tutup periode untuk mencegah perubahan neraca di dalamnya.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-[#666A61]">
                  Dari
                </label>
                <Input
                  type="date"
                  value={periodFrom}
                  onChange={(event) => setPeriodFrom(event.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#666A61]">
                  Sampai
                </label>
                <Input
                  type="date"
                  value={periodTo}
                  onChange={(event) => setPeriodTo(event.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => createPeriodMutation.mutate()}
              isLoading={createPeriodMutation.isPending}
            >
              Buat periode
            </Button>

            {periodsQuery.isLoading ? (
              <LoadingSpinner />
            ) : (periodsQuery.data ?? []).length === 0 ? (
              <EmptyState
                icon={Lock}
                title="Belum ada periode"
                description="Buat periode agar tutup buku dapat dilakukan."
              />
            ) : (
              <div className="space-y-2">
                {(periodsQuery.data ?? []).map((period) => (
                  <div
                    key={period.id}
                    className="flex flex-col gap-2 rounded-xl border border-[#EBE5DC] p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1F241D]">
                        {formatDate(period.period_from)} – {formatDate(period.period_to)}
                      </p>
                      <Badge variant={period.status === "closed" ? "success" : "info"}>
                        {period.status === "closed" ? "ditutup" : "terbuka"}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant={period.status === "closed" ? "secondary" : "primary"}
                      onClick={() =>
                        periodActionMutation.mutate({
                          period,
                          action: period.status === "closed" ? "reopen" : "close",
                        })
                      }
                      isLoading={periodActionMutation.isPending}
                    >
                      {period.status === "closed" ? (
                        <Unlock className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      {period.status === "closed" ? "Buka kembali" : "Tutup"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
