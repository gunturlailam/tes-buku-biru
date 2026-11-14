from sqlalchemy import (
    Column, Integer, Text, Date, DateTime, Numeric, Boolean, JSON,
    ForeignKey, UniqueConstraint, Index, func
)
from .db import Base

# 1. users: identity
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    full_name = Column(Text, nullable=False)
    is_superadmin = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 2. organizations: business workspace
class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 3. organization_members: user membership and role
class Membership(Base):
    __tablename__ = "organization_members"
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role = Column(Text, nullable=False, default="owner")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 4. business_profiles: industry, currency, timezone, accounting basis, fiscal settings
class BusinessProfile(Base):
    __tablename__ = "business_profiles"
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True)
    industry = Column(Text)
    currency = Column(Text, nullable=False, default="IDR")
    timezone = Column(Text, nullable=False, default="Asia/Jakarta")
    accounting_basis = Column(Text, nullable=False, default="cash")
    fiscal_start_month = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 5. accounts: chart-of-accounts entries
class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    code = Column(Text, nullable=False)
    name = Column(Text, nullable=False)
    account_type = Column(Text, nullable=False)  # asset, liability, equity, revenue, expense
    normal_balance = Column(Text, nullable=False, default="debit")  # debit, credit
    # Role neraca untuk mesin rasio: cash, receivable, inventory, prepaid,
    # other_current_asset, payable, short_term_loan, tax_payable,
    # long_term_loan, equity, revenue, cogs, operating_expense,
    # interest_expense, tax_expense, other.
    account_role = Column(Text, nullable=True)
    is_current = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint("organization_id", "code"),)

# 6. categories: user-facing transaction categories mapped to account/financial treatment
class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    tx_type = Column(Text, nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    # True untuk kategori HPP/COGS. Dipakai mesin rasio untuk GPM/OPM.
    is_cogs = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint("organization_id", "name", "tx_type"),)

# 7. transactions: financial events
class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    transaction_date = Column(Date, nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    tx_type = Column(Text, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    status = Column(Text, nullable=False, default="posted")  # posted, reversed, void
    reversal_of_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (Index("idx_tx_org_date", "organization_id", "transaction_date"),)

# 8. transaction_reversals: correction history
class TransactionReversal(Base):
    __tablename__ = "transaction_reversals"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    original_transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    reversal_transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    reason = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 9. import_batches: upload metadata, status, source, hash
class ImportBatch(Base):
    __tablename__ = "import_batches"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    filename = Column(Text, nullable=False)
    file_hash = Column(Text, nullable=True)
    source = Column(Text, nullable=False, default="csv")
    status = Column(Text, nullable=False, default="preview")  # preview, confirmed, failed
    total_rows = Column(Integer, nullable=False, default=0)
    valid_rows = Column(Integer, nullable=False, default=0)
    duplicate_rows = Column(Integer, nullable=False, default=0)
    error_rows = Column(Integer, nullable=False, default=0)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 10. import_rows: row validation and duplicate status
class ImportRow(Base):
    __tablename__ = "import_rows"
    id = Column(Integer, primary_key=True, autoincrement=True)
    import_batch_id = Column(Integer, ForeignKey("import_batches.id", ondelete="CASCADE"), nullable=False)
    row_index = Column(Integer, nullable=False)
    raw_data = Column(JSON, nullable=True)
    parsed_data = Column(JSON, nullable=True)
    status = Column(Text, nullable=False, default="valid")  # valid, invalid, duplicate
    error_message = Column(Text, nullable=True)
    is_duplicate = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 11. opening_balances: opening account balances by effective date
class OpeningBalance(Base):
    __tablename__ = "opening_balances"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    effective_date = Column(Date, nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 12. financial_calculation_runs: period, formula version, quality status
class FinancialCalculationRun(Base):
    __tablename__ = "financial_calculation_runs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    period_from = Column(Date, nullable=False)
    period_to = Column(Date, nullable=False)
    formula_version = Column(Text, nullable=False)
    data_quality_status = Column(Text, nullable=False)  # usable, partial, insufficient, verified
    calculated_metrics = Column(JSON, nullable=True)
    warnings = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 13. risk_rule_versions: configurable thresholds
class RiskRuleVersion(Base):
    __tablename__ = "risk_rule_versions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    rule_code = Column(Text, unique=True, nullable=False)
    version = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    threshold_config = Column(JSON, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 14. risk_signals: triggered rule and evidence
class RiskSignal(Base):
    __tablename__ = "risk_signals"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    calculation_run_id = Column(Integer, ForeignKey("financial_calculation_runs.id", ondelete="SET NULL"), nullable=True)
    rule_code = Column(Text, nullable=False)
    level = Column(Text, nullable=False)  # normal, attention, critical, insufficient
    trigger_metric = Column(Text, nullable=False)
    current_value = Column(Text, nullable=True)
    threshold_value = Column(Text, nullable=True)
    explanation = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 15. forecast_runs: model version, training window, horizon, metrics
class ForecastRun(Base):
    __tablename__ = "forecast_runs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    target = Column(Text, nullable=False)  # cash_flow, revenue, profit
    horizon = Column(Integer, nullable=False)
    period_unit = Column(Text, nullable=False, default="month")
    model_version = Column(Text, nullable=False)
    baseline_model = Column(Text, nullable=True)
    training_window_from = Column(Date, nullable=False)
    training_window_to = Column(Date, nullable=False)
    evaluation_metrics = Column(JSON, nullable=True)
    predictions = Column(JSON, nullable=True)
    status = Column(Text, nullable=False, default="available")  # evaluating, available, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 16. recommendations: rule, evidence, status, user feedback
class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    calculation_run_id = Column(Integer, ForeignKey("financial_calculation_runs.id", ondelete="SET NULL"), nullable=True)
    rule_id = Column(Text, nullable=False)
    rule_version = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    priority = Column(Text, nullable=False)  # low, medium, high
    trigger_metrics = Column(JSON, nullable=True)
    evidence = Column(JSON, nullable=True)
    suggested_actions = Column(JSON, nullable=True)
    assumptions = Column(JSON, nullable=True)
    limitations = Column(JSON, nullable=True)
    status = Column(Text, nullable=False, default="active")  # active, reviewed, dismissed
    user_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 17. forecast_backtests: walk-forward validation results and gate status
class ForecastBacktest(Base):
    __tablename__ = "forecast_backtests"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    model_version = Column(Text, nullable=False)
    period_unit = Column(Text, nullable=False, default="month")
    horizon = Column(Integer, nullable=False)
    data_points = Column(Integer, nullable=False)
    training_window_from = Column(Date, nullable=True)
    training_window_to = Column(Date, nullable=True)
    aggregate_metrics = Column(JSON, nullable=True)   # mae, bias, wape, smape, mase
    baseline_metrics = Column(JSON, nullable=True)    # naive_mae, model_vs_naive
    gate_passed = Column(Boolean, nullable=False, default=False)
    gate_reason = Column(Text, nullable=True)
    status = Column(Text, nullable=False, default="passed")  # passed, failed, insufficient_data
    folds_summary = Column(JSON, nullable=True)       # list of fold results
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ==========================================
# RATIO CFO / ACCRUAL-LITE TABLES
# ==========================================

# 18. accounting_periods: periode akuntansi dengan status tutup buku
class AccountingPeriod(Base):
    __tablename__ = "accounting_periods"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    period_from = Column(Date, nullable=False)
    period_to = Column(Date, nullable=False)
    status = Column(Text, nullable=False, default="open")  # open, closed, preview
    closed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (
        UniqueConstraint("organization_id", "period_from", "period_to"),
        Index("idx_period_org_range", "organization_id", "period_from", "period_to"),
    )

# 19. balance_snapshots: header neraca per as-of date
class BalanceSnapshot(Base):
    __tablename__ = "balance_snapshots"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    period_id = Column(Integer, ForeignKey("accounting_periods.id", ondelete="SET NULL"), nullable=True)
    as_of_date = Column(Date, nullable=False)
    status = Column(Text, nullable=False, default="draft")  # draft, final
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (
        UniqueConstraint("organization_id", "as_of_date"),
        Index("idx_balance_snapshot_org_date", "organization_id", "as_of_date"),
    )

# 20. balance_snapshot_lines: saldo akun pada snapshot
class BalanceSnapshotLine(Base):
    __tablename__ = "balance_snapshot_lines"
    id = Column(Integer, primary_key=True, autoincrement=True)
    snapshot_id = Column(Integer, ForeignKey("balance_snapshots.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False)
    amount = Column(Numeric(18, 2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint("snapshot_id", "account_id"),)

# 21. receivables: piutang usaha
class Receivable(Base):
    __tablename__ = "receivables"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    customer_name = Column(Text, nullable=False)
    invoice_number = Column(Text, nullable=True)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    paid_amount = Column(Numeric(18, 2), nullable=False, default=0)
    status = Column(Text, nullable=False, default="open")  # open, partial, paid, overdue, written_off
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (Index("idx_receivable_org_due", "organization_id", "due_date", "status"),)

# 22. payables: utang usaha
class Payable(Base):
    __tablename__ = "payables"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    supplier_name = Column(Text, nullable=False)
    bill_number = Column(Text, nullable=True)
    bill_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    paid_amount = Column(Numeric(18, 2), nullable=False, default=0)
    status = Column(Text, nullable=False, default="open")  # open, partial, paid, overdue
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (Index("idx_payable_org_due", "organization_id", "due_date", "status"),)

# 23. inventory_items: master persediaan
class InventoryItem(Base):
    __tablename__ = "inventory_items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    sku = Column(Text, nullable=False)
    name = Column(Text, nullable=False)
    unit = Column(Text, nullable=False, default="pcs")
    cost_price = Column(Numeric(18, 2), nullable=False, default=0)
    quantity_on_hand = Column(Numeric(18, 4), nullable=False, default=0)
    reorder_point = Column(Numeric(18, 4), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (
        UniqueConstraint("organization_id", "sku"),
        Index("idx_inventory_item_org_sku", "organization_id", "sku"),
    )

# 24. inventory_movements: mutasi persediaan
class InventoryMovement(Base):
    __tablename__ = "inventory_movements"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    movement_date = Column(Date, nullable=False)
    movement_type = Column(Text, nullable=False)  # in, out, adjustment
    quantity = Column(Numeric(18, 4), nullable=False)
    unit_cost = Column(Numeric(18, 2), nullable=False, default=0)
    reference = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (Index("idx_inventory_move_org_date", "organization_id", "movement_date"),)

# 25. fixed_assets: aset tetap dan penyusutan
class FixedAsset(Base):
    __tablename__ = "fixed_assets"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    asset_category = Column(Text, nullable=True)
    acquisition_date = Column(Date, nullable=False)
    acquisition_cost = Column(Numeric(18, 2), nullable=False)
    accumulated_depreciation = Column(Numeric(18, 2), nullable=False, default=0)
    useful_life_months = Column(Integer, nullable=True)
    salvage_value = Column(Numeric(18, 2), nullable=False, default=0)
    status = Column(Text, nullable=False, default="active")  # active, disposed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (Index("idx_fixed_asset_org_status", "organization_id", "status"),)

# 26. loans: pinjaman dan saldo pokok
class Loan(Base):
    __tablename__ = "loans"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    lender = Column(Text, nullable=False)
    loan_type = Column(Text, nullable=False, default="term_loan")  # short_term, term_loan
    principal = Column(Numeric(18, 2), nullable=False)
    interest_rate = Column(Numeric(8, 4), nullable=False, default=0)
    term_months = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    outstanding_principal = Column(Numeric(18, 2), nullable=False)
    monthly_installment = Column(Numeric(18, 2), nullable=True)
    status = Column(Text, nullable=False, default="active")  # active, paid, defaulted
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (Index("idx_loan_org_status", "organization_id", "status"),)

# 27. ratio_thresholds: ambang rasio global atau per organisasi/industri
class RatioThreshold(Base):
    __tablename__ = "ratio_thresholds"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    ratio_code = Column(Text, nullable=False)
    industry = Column(Text, nullable=True)
    target = Column(Numeric(18, 4), nullable=True)
    warning = Column(Numeric(18, 4), nullable=True)
    critical = Column(Numeric(18, 4), nullable=True)
    direction = Column(Text, nullable=False, default="higher")  # higher, lower
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (Index("idx_ratio_threshold_org_code", "organization_id", "ratio_code"),)

# 28. ratio_snapshots: hasil perhitungan rasio per periode
class RatioSnapshot(Base):
    __tablename__ = "ratio_snapshots"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    period_from = Column(Date, nullable=False)
    period_to = Column(Date, nullable=False)
    as_of_date = Column(Date, nullable=False)
    formula_version = Column(Text, nullable=False)
    data_quality_status = Column(Text, nullable=False)  # usable, partial, insufficient
    ratios = Column(JSON, nullable=True)
    warnings = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (
        UniqueConstraint("organization_id", "period_from", "period_to", "formula_version"),
        Index("idx_ratio_snapshot_org_period", "organization_id", "period_from", "period_to"),
    )

# 29. audit_events: important actor/action/time metadata
class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(Text, nullable=False)
    entity_type = Column(Text, nullable=True)
    entity_id = Column(Integer, nullable=True)
    payload = Column(JSON, nullable=True)
    ip_address = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Auth session helper table
class Session(Base):
    __tablename__ = "sessions"
    token = Column(Text, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
