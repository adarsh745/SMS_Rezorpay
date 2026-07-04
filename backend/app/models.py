from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    course = Column(String, nullable=False)
    grade = Column(String, nullable=False)
    total_fee = Column(Integer, default=50000, nullable=False)
    paid_fee = Column(Integer, default=0, nullable=False)
    due_fee = Column(Integer, default=50000, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    amount = Column(Integer, nullable=False)  # in paise
    currency = Column(String, default="INR")
    razorpay_order_id = Column(String, unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String, unique=True, index=True, nullable=True)
    razorpay_signature = Column(String, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, SUCCESS, FAILED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
