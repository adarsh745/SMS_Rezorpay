from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import razorpay
from typing import List

from ..database import get_db
from .. import models, schemas, auth
from ..config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

router = APIRouter(prefix="/api/payments", tags=["Payments"])

# Initialize Razorpay Client
try:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
except Exception as e:
    print("Error initializing Razorpay Client:", e)
    razorpay_client = None

def get_or_create_student_for_user(db: Session, email: str) -> models.Student:
    """Helper to get student by email, or create a default one for easy testing."""
    student = db.query(models.Student).filter(models.Student.email == email).first()
    if not student:
        # Create a default student for the user to make testing the dashboard effortless
        username = email.split("@")[0].capitalize()
        student = models.Student(
            name=f"{username} (Student)",
            email=email,
            phone="9876543210",
            course="Computer Science & Engineering",
            grade="A+",
            total_fee=75000,
            paid_fee=0,
            due_fee=75000
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    return student

@router.get("/me", response_model=schemas.StudentResponse)
def get_my_student_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Retrieve the logged in student's profile."""
    return get_or_create_student_for_user(db, current_user.email)

@router.post("/create-order")
def create_payment_order(
    payment_in: schemas.PaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Create a new Razorpay order and log it as pending in our DB."""
    if not razorpay_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay client is not initialized."
        )

    student = get_or_create_student_for_user(db, current_user.email)
    
    # Amount validation
    if payment_in.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than zero."
        )
        
    if payment_in.amount > student.due_fee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount exceeds remaining due fee of {student.due_fee} INR."
        )

    amount_in_paise = payment_in.amount * 100

    try:
        # Create order in Razorpay
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "payment_capture": 1
        }
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        # Save payment log in our DB
        new_payment = models.Payment(
            student_id=student.id,
            amount=payment_in.amount,  # storing in Rupees for simplicity in our DB
            currency="INR",
            razorpay_order_id=razorpay_order["id"],
            status="PENDING"
        )
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)
        
        return {
            "key": RAZORPAY_KEY_ID,
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "order_id": razorpay_order["id"],
            "student_name": student.name,
            "student_email": student.email,
            "student_phone": student.phone
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate Razorpay order: {str(e)}"
        )

@router.post("/verify")
def verify_payment(
    verify_data: schemas.PaymentVerify,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Verify Razorpay payment signature and update student fee balances."""
    if not razorpay_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay client is not initialized."
        )

    # 1. Verify Signature
    params_dict = {
        'razorpay_order_id': verify_data.razorpay_order_id,
        'razorpay_payment_id': verify_data.razorpay_payment_id,
        'razorpay_signature': verify_data.razorpay_signature
    }
    
    try:
        razorpay_client.utility.verify_payment_signature(params_dict)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment signature verification failed."
        )

    # 2. Update Payment Log status to SUCCESS
    payment = db.query(models.Payment).filter(
        models.Payment.razorpay_order_id == verify_data.razorpay_order_id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment transaction log not found."
        )

    if payment.status == "SUCCESS":
        return {"status": "SUCCESS", "message": "Payment already processed."}

    payment.status = "SUCCESS"
    payment.razorpay_payment_id = verify_data.razorpay_payment_id
    payment.razorpay_signature = verify_data.razorpay_signature

    # 3. Update Student balances
    student = db.query(models.Student).filter(models.Student.id == payment.student_id).first()
    if student:
        student.paid_fee += payment.amount
        student.due_fee = max(0, student.total_fee - student.paid_fee)

    db.commit()
    
    return {
        "status": "SUCCESS",
        "message": "Payment verified and recorded successfully.",
        "paid_fee": student.paid_fee if student else 0,
        "due_fee": student.due_fee if student else 0
    }

@router.get("/history", response_model=List[schemas.PaymentResponse])
def get_payment_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Retrieve payment history for the logged in student."""
    student = get_or_create_student_for_user(db, current_user.email)
    return db.query(models.Payment).filter(
        models.Payment.student_id == student.id,
        models.Payment.status == "SUCCESS"
    ).order_by(models.Payment.created_at.desc()).all()
