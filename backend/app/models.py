from datetime import datetime

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    password_hash: Mapped[str]
    name: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(server_default=func.current_timestamp())


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str]
    type: Mapped[str]
    currency: Mapped[str] = mapped_column(default="EUR")
    is_active: Mapped[int] = mapped_column(default=1)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str]
    parent_id: Mapped[int | None]
    icon: Mapped[str | None]
    color: Mapped[str | None]


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"))
    date: Mapped[str]
    amount: Mapped[int]
    description: Mapped[str | None]
    counterparty: Mapped[str | None]
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    import_hash: Mapped[str] = mapped_column(unique=True, index=True)
    source: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(server_default=func.current_timestamp())


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    amount: Mapped[int]
    period: Mapped[str] = mapped_column(default="monthly")


class CategoryRule(Base):
    __tablename__ = "category_rules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    pattern: Mapped[str]
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    match_type: Mapped[str]
