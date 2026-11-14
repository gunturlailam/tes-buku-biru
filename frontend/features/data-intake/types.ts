export interface Account {
  id: number;
  code: string;
  name: string;
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  normal_balance: "debit" | "credit";
  is_active: boolean;
  account_role?: string | null;
}

export interface BalanceSnapshotLine {
  account_id: number;
  code: string;
  name: string;
  account_type: string;
  account_role: string | null;
  amount: string;
}

export interface BalanceSnapshot {
  id: number;
  as_of_date: string;
  status: "draft" | "final";
  notes: string | null;
  period_id: number | null;
  created_by: number;
  created_at: string;
  lines: BalanceSnapshotLine[];
  totals: {
    total_assets: string | null;
    total_liabilities: string | null;
    total_equity: string | null;
  };
  is_balanced: boolean | null;
  warnings: string[];
}

export interface AccountingPeriod {
  id: number;
  period_from: string;
  period_to: string;
  status: "open" | "closed";
  closed_by: number | null;
  closed_at: string | null;
  created_at: string;
}

export interface Receivable {
  id: number;
  customer_name: string;
  invoice_number: string | null;
  invoice_date: string;
  due_date: string;
  amount: string;
  paid_amount: string;
  outstanding_amount: string;
  status: "open" | "partial" | "paid" | "overdue" | "written_off";
  days_overdue: number;
  created_at: string;
}

export interface Payable {
  id: number;
  supplier_name: string;
  bill_number: string | null;
  bill_date: string;
  due_date: string;
  amount: string;
  paid_amount: string;
  outstanding_amount: string;
  status: "open" | "partial" | "paid" | "overdue";
  days_overdue: number;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  unit: string;
  cost_price: string;
  quantity_on_hand: string;
  reorder_point: string | null;
  is_low_stock: boolean;
  is_active: boolean;
  created_at: string;
}

export interface FixedAsset {
  id: number;
  name: string;
  asset_category: string | null;
  acquisition_date: string;
  acquisition_cost: string;
  accumulated_depreciation: string;
  book_value: string;
  useful_life_months: number | null;
  salvage_value: string;
  status: "active" | "disposed";
  created_at: string;
}

export interface Loan {
  id: number;
  lender: string;
  loan_type: "short_term" | "term_loan";
  principal: string;
  interest_rate: string;
  term_months: number;
  start_date: string;
  outstanding_principal: string;
  monthly_installment: string | null;
  status: "active" | "paid" | "defaulted";
  created_at: string;
}

export interface BalanceSnapshotPayload {
  as_of_date: string;
  status: "draft" | "final";
  notes?: string | null;
  lines: Array<{ account_id: number; amount: string }>;
}

export interface ReceivablePayload {
  customer_name: string;
  invoice_number?: string | null;
  invoice_date: string;
  due_date: string;
  amount: string;
  paid_amount: string;
  status?: Receivable["status"];
}

export interface PayablePayload {
  supplier_name: string;
  bill_number?: string | null;
  bill_date: string;
  due_date: string;
  amount: string;
  paid_amount: string;
  status?: Payable["status"];
}

export interface InventoryItemPayload {
  sku: string;
  name: string;
  unit: string;
  cost_price: string;
  quantity_on_hand: string;
  reorder_point?: string | null;
  is_active?: boolean;
}

export interface InventoryMovementPayload {
  movement_date: string;
  movement_type: "in" | "out" | "adjustment";
  quantity: string;
  unit_cost?: string;
  reference?: string | null;
}

export interface FixedAssetPayload {
  name: string;
  asset_category?: string | null;
  acquisition_date: string;
  acquisition_cost: string;
  accumulated_depreciation: string;
  useful_life_months?: number | null;
  salvage_value: string;
  status?: FixedAsset["status"];
}

export interface LoanPayload {
  lender: string;
  loan_type: Loan["loan_type"];
  principal: string;
  interest_rate: string;
  term_months: number;
  start_date: string;
  outstanding_principal: string;
  monthly_installment?: string | null;
  status?: Loan["status"];
}

export interface ImportPreviewRow {
  row_index: number;
  transaction_date: string;
  description: string;
  amount: string;
  tx_type: string;
  category_id: number | null;
  category_name: string;
  is_duplicate: boolean;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportPreviewResponse {
  batch_id: number;
  filename: string;
  total_rows: number;
  valid_count: number;
  duplicate_count: number;
  error_count: number;
  rows: ImportPreviewRow[];
  errors: ImportError[];
}

export interface ImportConfirmResponse {
  batch_id: number;
  imported_count: number;
  skipped_count: number;
  message: string;
}
