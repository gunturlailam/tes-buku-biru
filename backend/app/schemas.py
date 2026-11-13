from datetime import date
from decimal import Decimal
from typing import Literal, Optional, List
from pydantic import BaseModel, Field

TxType = Literal["income", "expense", "transfer", "owner_contribution",
                 "owner_draw", "loan_received", "loan_repayment", "refund"]

class RegisterIn(BaseModel):
    email: str
    password: str = Field(min_length=8)
    full_name: str
    organization_name: str

class LoginIn(BaseModel):
    email: str
    password: str

class TransactionIn(BaseModel):
    transaction_date: date
    description: str = Field(min_length=1)
    amount: Decimal = Field(gt=0, max_digits=16, decimal_places=2)
    tx_type: TxType
    category_id: Optional[int] = None

class TransactionUpdate(BaseModel):
    transaction_date: Optional[date] = None
    description: Optional[str] = Field(None, min_length=1)
    amount: Optional[Decimal] = Field(None, gt=0, max_digits=16, decimal_places=2)
    tx_type: Optional[TxType] = None
    category_id: Optional[int] = None

class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    industry: Optional[str] = None
    currency: Optional[str] = "IDR"
    timezone: Optional[str] = "Asia/Jakarta"
    accounting_basis: Optional[str] = "cash"

class ImportConfirmItem(BaseModel):
    transaction_date: date
    description: str = Field(min_length=1)
    amount: Decimal = Field(gt=0, max_digits=16, decimal_places=2)
    tx_type: TxType
    category_id: Optional[int] = None

class ImportConfirmIn(BaseModel):
    transactions: List[ImportConfirmItem]
