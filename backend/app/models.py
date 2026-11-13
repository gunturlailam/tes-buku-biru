from sqlalchemy import (Column, Integer, Text, Date, DateTime, Numeric,
                        ForeignKey, UniqueConstraint, Index, func)
from .db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    full_name = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Membership(Base):
    __tablename__ = "organization_members"
    organization_id = Column(Integer, ForeignKey("organizations.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    role = Column(Text, nullable=False, default="owner")

class BusinessProfile(Base):
    __tablename__ = "business_profiles"
    organization_id = Column(Integer, ForeignKey("organizations.id"), primary_key=True)
    industry = Column(Text)
    currency = Column(Text, nullable=False, default="IDR")
    timezone = Column(Text, nullable=False, default="Asia/Jakarta")
    accounting_basis = Column(Text, nullable=False, default="cash")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(Text, nullable=False)
    tx_type = Column(Text, nullable=False)
    __table_args__ = (UniqueConstraint("organization_id", "name", "tx_type"),)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    transaction_date = Column(Date, nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    tx_type = Column(Text, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    status = Column(Text, nullable=False, default="posted")
    reversal_of_id = Column(Integer, ForeignKey("transactions.id"))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (Index("idx_tx_org_date", "organization_id", "transaction_date"),)

class Session(Base):
    __tablename__ = "sessions"
    token = Column(Text, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())