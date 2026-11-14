import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ImportsPage from "@/app/(dashboard)/imports/page";
import { dataIntakeApi } from "@/features/data-intake/api/data-intake-api";

jest.mock("@/features/data-intake/api/data-intake-api", () => ({
  dataIntakeApi: {
    previewImport: jest.fn(),
    confirmImport: jest.fn(),
  },
}));

const previewMock = dataIntakeApi.previewImport as jest.Mock;
const confirmMock = dataIntakeApi.confirmImport as jest.Mock;

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ImportsPage />
    </QueryClientProvider>,
  );
}

describe("ImportsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("previews a CSV and confirms the same batch", async () => {
    previewMock.mockResolvedValue({
      batch_id: 7,
      filename: "transaksi.csv",
      total_rows: 1,
      valid_count: 1,
      duplicate_count: 0,
      error_count: 0,
      rows: [
        {
          row_index: 1,
          transaction_date: "2026-01-15",
          description: "Penjualan harian",
          amount: "250000.00",
          tx_type: "income",
          category_id: 1,
          category_name: "Penjualan",
          is_duplicate: false,
        },
      ],
      errors: [],
    });
    confirmMock.mockResolvedValue({
      batch_id: 7,
      imported_count: 1,
      skipped_count: 0,
      message: "Berhasil mengimpor 1 transaksi; 0 baris dilewati.",
    });

    const { container } = renderPage();
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();

    const file = new File(["transaction_date,description,amount,type"], "transaksi.csv", {
      type: "text/csv",
    });
    await userEvent.upload(fileInput as HTMLInputElement, file);
    await userEvent.click(screen.getByRole("button", { name: /preview & validasi/i }));

    expect(await screen.findByText(/Hasil preview batch #7/i)).toBeInTheDocument();
    expect(screen.getByText("Penjualan harian")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /konfirmasi import/i }));

    await waitFor(() => {
      expect(confirmMock.mock.calls[0][0]).toBe(7);
    });
    expect(
      await screen.findByText(/Berhasil mengimpor 1 transaksi/i),
    ).toBeInTheDocument();
  });
});
