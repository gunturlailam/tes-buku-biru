"use client";

import { useRef, useState } from "react";
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
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { dataIntakeApi } from "@/features/data-intake/api/data-intake-api";
import type {
  ImportConfirmResponse,
  ImportPreviewResponse,
} from "@/features/data-intake/types";
import { getErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ImportsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [confirmed, setConfirmed] = useState<ImportConfirmResponse | null>(null);
  const [error, setError] = useState("");

  const previewMutation = useMutation({
    mutationFn: dataIntakeApi.previewImport,
    onMutate: () => {
      setError("");
      setConfirmed(null);
    },
    onSuccess: (data) => {
      setPreview(data);
    },
    onError: (err) => {
      setPreview(null);
      setError(getErrorMessage(err));
    },
  });

  const confirmMutation = useMutation({
    mutationFn: dataIntakeApi.confirmImport,
    onSuccess: async (data) => {
      setConfirmed(data);
      setPreview(null);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["financial-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["financial-health"] }),
        queryClient.invalidateQueries({ queryKey: ["ratios"] }),
        queryClient.invalidateQueries({ queryKey: ["balance-sheet"] }),
        queryClient.invalidateQueries({ queryKey: ["balance-snapshots"] }),
      ]);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleFileChange = (selected: File | null) => {
    setError("");
    setPreview(null);
    setConfirmed(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setError("File harus berformat CSV.");
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError("Ukuran file maksimal 5 MB.");
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const importableRows = preview
    ? preview.rows.filter((row) => !row.is_duplicate).length
    : 0;

  const downloadTemplate = () => {
    const csv =
      "transaction_date,description,amount,type,category\n" +
      "2026-01-15,Penjualan harian,250000,income,Penjualan\n" +
      "2026-01-16,Biaya listrik,75000,expense,Operasional\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template-transaksi-profitai.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-[#1F241D]">
            Import Data Transaksi
          </h1>
          <p className="text-sm text-[#7E8379] mt-1">
            Unggah CSV, periksa hasil validasi, lalu konfirmasi batch yang sama.
            Tidak ada transaksi yang masuk sebelum Anda menekan konfirmasi.
          </p>
        </div>
        <Button variant="secondary" onClick={downloadTemplate}>
          <Download className="w-4 h-4" />
          Unduh Template CSV
        </Button>
      </div>

      {error && (
        <Alert variant="error" title="Import gagal">
          {error}
        </Alert>
      )}

      {confirmed && (
        <Alert variant="success" title="Import selesai">
          {confirmed.message}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Pilih file CSV
          </CardTitle>
          <CardDescription>
            Kolom wajib: transaction_date, description, amount, type. Kolom
            opsional: category. Format tanggal YYYY-MM-DD. Maksimal 5 MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="block w-full cursor-pointer rounded-xl border border-[#EBE5DC] bg-[#FAF7F2] px-4 py-3 text-sm text-[#666A61] file:mr-4 file:rounded-lg file:border-0 file:bg-[#273420] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#314028]"
            onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => file && previewMutation.mutate(file)}
              disabled={!file || previewMutation.isPending}
              isLoading={previewMutation.isPending}
            >
              <Upload className="w-4 h-4" />
              Preview & Validasi
            </Button>
            {file && (
              <span className="text-xs text-[#7E8379]">
                {file.name} ┬╖ {(file.size / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {previewMutation.isPending && (
        <div className="flex items-center justify-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {preview && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Hasil preview batch #{preview.batch_id}</CardTitle>
                <CardDescription>{preview.filename}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{preview.total_rows} baris</Badge>
                <Badge variant="success">{importableRows} siap impor</Badge>
                <Badge variant="warning">
                  {preview.duplicate_count} duplikat
                </Badge>
                <Badge variant="error">{preview.error_count} error</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview.error_count > 0 && (
              <Alert variant="warning" title="Sebagian baris tidak valid">
                Baris yang error tidak akan diimpor. Perbaiki CSV lalu unggah
                ulang jika diperlukan.
                <ul className="mt-2 list-disc pl-5">
                  {preview.errors.slice(0, 5).map((item) => (
                    <li key={`${item.row}-${item.field}`}>
                      Baris {item.row} ┬╖ {item.field}: {item.message}
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Baris</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row) => (
                    <TableRow key={row.row_index}>
                      <TableCell>{row.row_index}</TableCell>
                      <TableCell>{formatDate(row.transaction_date)}</TableCell>
                      <TableCell className="max-w-[280px] truncate">
                        {row.description}
                      </TableCell>
                      <TableCell>{row.tx_type}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.amount)}
                      </TableCell>
                      <TableCell>
                        {row.is_duplicate ? (
                          <Badge variant="warning">Duplikat</Badge>
                        ) : (
                          <Badge variant="success">Valid</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#EBE5DC] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#7E8379]">
                Konfirmasi akan mengimpor {importableRows} baris valid dan
                melewati baris duplikat/error.
              </p>
              <Button
                onClick={() => confirmMutation.mutate(preview.batch_id)}
                disabled={importableRows === 0 || confirmMutation.isPending}
                isLoading={confirmMutation.isPending}
              >
                <CheckCircle2 className="w-4 h-4" />
                Konfirmasi Import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!preview && !previewMutation.isPending && (
        <Card>
          <CardContent className="pt-5">
            <EmptyState
              icon={FileSpreadsheet}
              title="Belum ada preview"
              description="Pilih file CSV dan jalankan preview untuk melihat validasi, duplikat, dan baris yang siap diimpor."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
