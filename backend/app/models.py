from sqlalchemy import (Column, BigInteger, Text, Date, DateTime, Numeric,
                        ForeignKey, UniqueConstraint, Index, func)
from .db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(BigInteger, primary_key=True)
    email = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    full_name = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(BigInteger, primary_key=True)
    name = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Membership(Base):
    __tablename__ = "organization_members"
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), primary_key=True)
    role = Column(Text, nullable=False, default="owner")

class BusinessProfile(Base):
    __tablename__ = "business_profiles"
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), primary_key=True)
    industry = Column(Text)
    currency = Column(Text, nullable=False, default="IDR")
    timezone = Column(Text, nullable=False, default="Asia/Jakarta")
    accounting_basis = Column(Text, nullable=False, default="cash")

class Category(Base):
    __tablename__ = "categories"
    id = Column(BigInteger, primary_key=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=False)
    name = Column(Text, nullable=False)
    tx_type = Column(Text, nullable=False)
    __table_args__ = (UniqueConstraint("organization_id", "name", "tx_type"),)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(BigInteger, primary_key=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=False)
    transaction_date = Column(Date, nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    tx_type = Column(Text, nullable=False)
    category_id = Column(BigInteger, ForeignKey("categories.id"))
    status = Column(Text, nullable=False, default="posted")
    reversal_of_id = Column(BigInteger, ForeignKey("transactions.id"))
    created_by = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (Index("idx_tx_org_date", "organization_id", "transaction_date"),)

class Session(Base):
    __tablename__ = "sessions"
    token = Column(Text, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())