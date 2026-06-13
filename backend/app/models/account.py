from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.db import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # checking | savings | credit | paypal
    currency = Column(String, default="EUR")
    is_active = Column(Boolean, default=True)

    transactions = relationship("Transaction", back_populates="account")
