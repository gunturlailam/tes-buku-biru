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
    transactions: List[ImportConfirmItem]

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

class RiskRuleUpdate(BaseModel):
    threshold_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
