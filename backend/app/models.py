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

# 17. audit_events: important actor/action/time metadata
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
