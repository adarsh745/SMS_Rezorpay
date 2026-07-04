from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

class UserLogin(UserBase):
    password: str

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Student Schemas
class StudentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    course: str = Field(..., min_length=1)
    grade: str = Field(..., min_length=1)
    total_fee: Optional[int] = 50000
    paid_fee: Optional[int] = 0
    due_fee: Optional[int] = 50000

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    course: Optional[str] = Field(None, min_length=1)
    grade: Optional[str] = Field(None, min_length=1)
    total_fee: Optional[int] = None
    paid_fee: Optional[int] = None
    due_fee: Optional[int] = None

class StudentResponse(StudentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Payment Schemas
class PaymentCreate(BaseModel):
    amount: int  # in rupees (we'll convert to paise internally)

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class PaymentResponse(BaseModel):
    id: int
    student_id: int
    amount: int
    currency: str
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
