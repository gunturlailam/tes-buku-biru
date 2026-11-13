from datetime import date
from decimal import Decimal
from typing import Literal, Optional
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