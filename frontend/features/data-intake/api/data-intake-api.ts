import { apiClient } from "@/lib/api-client";
import type {
  Account,
  AccountingPeriod,
  BalanceSnapshot,
  BalanceSnapshotPayload,
  FixedAsset,
  FixedAssetPayload,
  ImportConfirmResponse,
  ImportPreviewResponse,
  InventoryItem,
  InventoryItemPayload,
  InventoryMovementPayload,
  Loan,
  LoanPayload,
  Payable,
  PayablePayload,
  Receivable,
  ReceivablePayload,
} from "../types";

const dateOnly = (value: string) => String(value).split("T")[0];

export const dataIntakeApi = {
  listAccounts: async (): Promise<Account[]> => {
    const { data } = await apiClient.get<Account[]>("/accounts");
    return data;
  },

  listBalanceSnapshots: async (asOf?: string): Promise<BalanceSnapshot[]> => {
    const { data } = await apiClient.get<BalanceSnapshot[]>("/balance-sheets", {
      params: asOf ? { as_of: dateOnly(asOf) } : undefined,
    });
    return data;
  },

  getBalanceSnapshot: async (id: number): Promise<BalanceSnapshot> => {
    const { data } = await apiClient.get<BalanceSnapshot>(`/balance-sheets/${id}`);
    return data;
  },

  upsertBalanceSnapshot: async (
    payload: BalanceSnapshotPayload,
  ): Promise<BalanceSnapshot> => {
    const { data } = await apiClient.post<BalanceSnapshot>("/balance-sheets", {
      ...payload,
      as_of_date: dateOnly(payload.as_of_date),
    });
    return data;
  },

  updateBalanceSnapshot: async (
    id: number,
    payload: Partial<BalanceSnapshotPayload> & {
      status?: BalanceSnapshot["status"];
      notes?: string | null;
    },
  ): Promise<BalanceSnapshot> => {
    const { data } = await apiClient.patch<BalanceSnapshot>(
      `/balance-sheets/${id}`,
      payload,
    );
    return data;
  },

  listPeriods: async (): Promise<AccountingPeriod[]> => {
    const { data } = await apiClient.get<AccountingPeriod[]>("/accounting-periods");
    return data;
  },

  createPeriod: async (periodFrom: string, periodTo: string): Promise<AccountingPeriod> => {
    const { data } = await apiClient.post<AccountingPeriod>("/accounting-periods", {
      period_from: dateOnly(periodFrom),
      period_to: dateOnly(periodTo),
    });
    return data;
  },

  closePeriod: async (id: number): Promise<AccountingPeriod> => {
    const { data } = await apiClient.post<AccountingPeriod>(
      `/accounting-periods/${id}/close`,
    );
    return data;
  },

  reopenPeriod: async (id: number): Promise<AccountingPeriod> => {
    const { data } = await apiClient.post<AccountingPeriod>(
      `/accounting-periods/${id}/reopen`,
    );
    return data;
  },

  listReceivables: async (): Promise<Receivable[]> => {
    const { data } = await apiClient.get<Receivable[]>("/receivables");
    return data;
  },

  createReceivable: async (payload: ReceivablePayload): Promise<Receivable> => {
    const { data } = await apiClient.post<Receivable>("/receivables", payload);
    return data;
  },

  updateReceivable: async (
    id: number,
    payload: Partial<ReceivablePayload>,
  ): Promise<Receivable> => {
    const { data } = await apiClient.patch<Receivable>(`/receivables/${id}`, payload);
    return data;
  },

  listPayables: async (): Promise<Payable[]> => {
    const { data } = await apiClient.get<Payable[]>("/payables");
    return data;
  },

  createPayable: async (payload: PayablePayload): Promise<Payable> => {
    const { data } = await apiClient.post<Payable>("/payables", payload);
    return data;
  },

  updatePayable: async (
    id: number,
    payload: Partial<PayablePayload>,
  ): Promise<Payable> => {
    const { data } = await apiClient.patch<Payable>(`/payables/${id}`, payload);
    return data;
  },

  listInventoryItems: async (): Promise<InventoryItem[]> => {
    const { data } = await apiClient.get<InventoryItem[]>("/inventory-items");
    return data;
  },

  createInventoryItem: async (
    payload: InventoryItemPayload,
  ): Promise<InventoryItem> => {
    const { data } = await apiClient.post<InventoryItem>("/inventory-items", payload);
    return data;
  },

  updateInventoryItem: async (
    id: number,
    payload: Partial<InventoryItemPayload>,
  ): Promise<InventoryItem> => {
    const { data } = await apiClient.patch<InventoryItem>(
      `/inventory-items/${id}`,
      payload,
    );
    return data;
  },

  createInventoryMovement: async (
    itemId: number,
    payload: InventoryMovementPayload,
  ) => {
    const { data } = await apiClient.post(
      `/inventory-items/${itemId}/movements`,
      {
        ...payload,
        movement_date: dateOnly(payload.movement_date),
      },
    );
    return data;
  },

  listFixedAssets: async (): Promise<FixedAsset[]> => {
    const { data } = await apiClient.get<FixedAsset[]>("/fixed-assets");
    return data;
  },

  createFixedAsset: async (payload: FixedAssetPayload): Promise<FixedAsset> => {
    const { data } = await apiClient.post<FixedAsset>("/fixed-assets", {
      ...payload,
      acquisition_date: dateOnly(payload.acquisition_date),
    });
    return data;
  },

  updateFixedAsset: async (
    id: number,
    payload: Partial<FixedAssetPayload>,
  ): Promise<FixedAsset> => {
    const { data } = await apiClient.patch<FixedAsset>(`/fixed-assets/${id}`, payload);
    return data;
  },

  listLoans: async (): Promise<Loan[]> => {
    const { data } = await apiClient.get<Loan[]>("/loans");
    return data;
  },

  createLoan: async (payload: LoanPayload): Promise<Loan> => {
    const { data } = await apiClient.post<Loan>("/loans", {
      ...payload,
      start_date: dateOnly(payload.start_date),
    });
    return data;
  },

  updateLoan: async (id: number, payload: Partial<LoanPayload>): Promise<Loan> => {
    const { data } = await apiClient.patch<Loan>(`/loans/${id}`, payload);
    return data;
  },

  previewImport: async (file: File): Promise<ImportPreviewResponse> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<ImportPreviewResponse>(
      "/imports/transactions/preview",
      form,
    );
    return data;
  },

  confirmImport: async (batchId: number): Promise<ImportConfirmResponse> => {
    const { data } = await apiClient.post<ImportConfirmResponse>(
      "/imports/transactions/confirm",
      { batch_id: batchId },
    );
    return data;
  },
};
