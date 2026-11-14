from datetime import date
from decimal import Decimal
from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field

TxType = Literal["income", "expense", "transfer", "owner_contribution",
                 "owner_draw", "loan_received", "loan_repayment", "refund"]

AccountType = Literal["asset", "liability", "equity", "revenue", "expense"]
NormalBalance = Literal["debit", "credit"]
MemberRole = Literal["owner", "admin", "member", "viewer"]

class RegisterIn(BaseModel):
    email: str
    password: str = Field(min_length=8)
    full_name: str
    organization_name: str
    industry: Optional[str] = None

class LoginIn(BaseModel):
    email: str
    password: str

class OrganizationCreate(BaseModel):
    name: str = Field(min_length=1)
    industry: Optional[str] = "F&B"
    currency: Optional[str] = "IDR"
    timezone: Optional[str] = "Asia/Jakarta"
    accounting_basis: Optional[str] = "cash"

class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    industry: Optional[str] = None
    currency: Optional[str] = "IDR"
    timezone: Optional[str] = "Asia/Jakarta"
    accounting_basis: Optional[str] = "cash"

class MemberAdd(BaseModel):
    email: str
    role: MemberRole = "member"

class MemberRoleUpdate(BaseModel):
    role: MemberRole

class AccountCreate(BaseModel):
    code: str = Field(min_length=1)
    name: str = Field(min_length=1)
    account_type: AccountType
    normal_balance: NormalBalance = "debit"
    is_active: bool = True

class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    account_type: Optional[AccountType] = None
    normal_balance: Optional[NormalBalance] = None
    is_active: Optional[bool] = None

class CategoryCreate(BaseModel):
    name: str = Field(min_length=1)
    tx_type: TxType
    account_id: Optional[int] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    tx_type: Optional[TxType] = None
    account_id: Optional[int] = None

class TransactionIn(BaseModel):
    transaction_date: date
    description: str = Field(min_length=1)
    amount: Decimal = Field(gt=0, max_digits=16, decimal_places=2)
    tx_type: TxType
    category_id: Optional[int] = None
    account_id: Optional[int] = None

class TransactionUpdate(BaseModel):
    transaction_date: Optional[date] = None
    description: Optional[str] = Field(None, min_length=1)
    amount: Optional[Decimal] = Field(None, gt=0, max_digits=16, decimal_places=2)
    tx_type: Optional[TxType] = None
    category_id: Optional[int] = None
    account_id: Optional[int] = None

class ImportConfirmItem(BaseModel):
    transaction_date: date
    description: str = Field(min_length=1)
    amount: Decimal = Field(gt=0, max_digits=16, decimal_places=2)
    tx_type: TxType
    category_id: Optional[int] = None
    account_id: Optional[int] = None

class ImportConfirmIn(BaseModel):
    batch_id: int
    transactions: Optional[List[ImportConfirmItem]] = None

class BalanceSnapshotLineIn(BaseModel):
    account_id: int
    amount: Decimal = Field(max_digits=18, decimal_places=2)

class BalanceSnapshotCreate(BaseModel):
    as_of_date: date
    status: Literal["draft", "final"] = "draft"
    notes: Optional[str] = None
    lines: List[BalanceSnapshotLineIn] = Field(min_length=1)

class BalanceSnapshotUpdate(BaseModel):
    status: Optional[Literal["draft", "final"]] = None
    notes: Optional[str] = None
    lines: Optional[List[BalanceSnapshotLineIn]] = None

class AccountingPeriodCreate(BaseModel):
    period_from: date
    period_to: date

class ReceivableCreate(BaseModel):
    customer_name: str = Field(min_length=1)
    invoice_number: Optional[str] = None
    invoice_date: date
    due_date: date
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    paid_amount: Decimal = Field(default=Decimal("0"), ge=0, max_digits=18, decimal_places=2)
    status: Literal["open", "partial", "paid", "overdue", "written_off"] = "open"

class ReceivableUpdate(BaseModel):
    customer_name: Optional[str] = Field(None, min_length=1)
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    amount: Optional[Decimal] = Field(None, gt=0, max_digits=18, decimal_places=2)
    paid_amount: Optional[Decimal] = Field(None, ge=0, max_digits=18, decimal_places=2)
    status: Optional[Literal["open", "partial", "paid", "overdue", "written_off"]] = None

class PayableCreate(BaseModel):
    supplier_name: str = Field(min_length=1)
    bill_number: Optional[str] = None
    bill_date: date
    due_date: date
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    paid_amount: Decimal = Field(default=Decimal("0"), ge=0, max_digits=18, decimal_places=2)
    status: Literal["open", "partial", "paid", "overdue"] = "open"

class PayableUpdate(BaseModel):
    supplier_name: Optional[str] = Field(None, min_length=1)
    bill_number: Optional[str] = None
    bill_date: Optional[date] = None
    due_date: Optional[date] = None
    amount: Optional[Decimal] = Field(None, gt=0, max_digits=18, decimal_places=2)
    paid_amount: Optional[Decimal] = Field(None, ge=0, max_digits=18, decimal_places=2)
    status: Optional[Literal["open", "partial", "paid", "overdue"]] = None

class InventoryItemCreate(BaseModel):
    sku: str = Field(min_length=1)
    name: str = Field(min_length=1)
    unit: str = Field(default="pcs", min_length=1)
    cost_price: Decimal = Field(default=Decimal("0"), ge=0, max_digits=18, decimal_places=2)
    quantity_on_hand: Decimal = Field(default=Decimal("0"), ge=0, max_digits=18, decimal_places=4)
    reorder_point: Optional[Decimal] = Field(None, ge=0, max_digits=18, decimal_places=4)
    is_active: bool = True

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    unit: Optional[str] = Field(None, min_length=1)
    cost_price: Optional[Decimal] = Field(None, ge=0, max_digits=18, decimal_places=2)
    quantity_on_hand: Optional[Decimal] = Field(None, ge=0, max_digits=18, decimal_places=4)
    reorder_point: Optional[Decimal] = Field(None, ge=0, max_digits=18, decimal_places=4)
    is_active: Optional[bool] = None

class InventoryMovementCreate(BaseModel):
    movement_date: date
    movement_type: Literal["in", "out", "adjustment"]
    quantity: Decimal = Field(max_digits=18, decimal_places=4)
    unit_cost: Decimal = Field(default=Decimal("0"), ge=0, max_digits=18, decimal_places=2)
    reference: Optional[str] = None

class FixedAssetCreate(BaseModel):
    name: str = Field(min_length=1)
    asset_category: Optional[str] = None
    acquisition_date: date
    acquisition_cost: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    accumulated_depreciation: Decimal = Field(default=Decimal("0"), ge=0, max_digits=18, decimal_places=2)
    useful_life_months: Optional[int] = Field(None, ge=1)
    salvage_value: Decimal = Field(default=Decimal("0"), ge=0, max_digits=18, decimal_places=2)
    status: Literal["active", "disposed"] = "active"

class FixedAssetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    asset_category: Optional[str] = None
    acquisition_date: Optional[date] = None
    acquisition_cost: Optional[Decimal] = Field(None, gt=0, max_digits=18, decimal_places=2)
    accumulated_depreciation: Optional[Decimal] = Field(None, ge=0, max_digits=18, decimal_places=2)
    useful_life_months: Optional[int] = Field(None, ge=1)
    salvage_value: Optional[Decimal] = Field(None, ge=0, max_digits=18, decimal_places=2)
    status: Optional[Literal["active", "disposed"]] = None

class LoanCreate(BaseModel):
    lender: str = Field(min_length=1)
    loan_type: Literal["short_term", "term_loan"] = "term_loan"
    principal: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    interest_rate: Decimal = Field(default=Decimal("0"), ge=0, le=100, max_digits=8, decimal_places=4)
    term_months: int = Field(ge=1)
    start_date: date
    outstanding_principal: Decimal = Field(ge=0, max_digits=18, decimal_places=2)
    monthly_installment: Optional[Decimal] = Field(None, ge=0, max_digits=18, decimal_places=2)
    status: Literal["active", "paid", "defaulted"] = "active"

class LoanUpdate(BaseModel):
    lender: Optional[str] = Field(None, min_length=1)
    loan_type: Optional[Literal["short_term", "term_loan"]] = None
    principal: Optional[Decimal] = Field(None, gt=0, max_digits=18, decimal_places=2)
    interest_rate: Optional[Decimal] = Field(None, ge=0, le=100, max_digits=8, decimal_places=4)
    term_months: Optional[int] = Field(None, ge=1)
    start_date: Optional[date] = None
    outstanding_principal: Optional[Decimal] = Field(None, ge=0, max_digits=18, decimal_places=2)
    monthly_installment: Optional[Decimal] = Field(None, ge=0, max_digits=18, decimal_places=2)
    status: Optional[Literal["active", "paid", "defaulted"]] = None

class OpeningBalanceCreate(BaseModel):
    account_id: int
    effective_date: date
    amount: Decimal = Field(max_digits=16, decimal_places=2)

class OpeningBalanceUpdate(BaseModel):
    effective_date: Optional[date] = None
    amount: Optional[Decimal] = Field(None, max_digits=16, decimal_places=2)

class ForecastCreate(BaseModel):
    target: Literal["cash_flow", "revenue", "profit"] = "cash_flow"
    horizon: int = Field(default=3, ge=1, le=12)
    period_unit: Literal["day", "week", "month"] = "month"

class RecommendationUpdate(BaseModel):
    status: Literal["active", "reviewed", "dismissed"]
    user_feedback: Optional[str] = None

class RatioThresholdUpdate(BaseModel):
    target: Decimal = Field(ge=0)
    warning: Decimal = Field(ge=0)
    critical: Decimal = Field(ge=0)
    direction: Literal["higher", "lower"]

class RiskRuleUpdate(BaseModel):
    threshold_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class ForecastBacktestCreate(BaseModel):
    horizon: int = Field(default=3, ge=1, le=12)
    period_unit: Literal["day", "week", "month"] = "month"
    min_train_periods: int = Field(default=3, ge=2, le=24)
