from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    amount_cents = Column(Integer, nullable=False)
    description = Column(String)
    counterparty = Column(String)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    import_hash = Column(String, unique=True, index=True)
    source = Column(String)  # csv_dkb | csv_hanseatic | csv_openbank | paypal | manual
    created_at = Column(DateTime, default=func.now())

    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
