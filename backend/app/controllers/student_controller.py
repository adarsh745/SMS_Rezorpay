from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas

def create_student(student: schemas.StudentCreate, db: Session):
    # Check if student email is already registered
    db_student = db.query(models.Student).filter(models.Student.email == student.email).first()
    if db_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this email already exists"
        )
    
    new_student = models.Student(**student.model_dump())
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student

def get_all_students(db: Session):
    return db.query(models.Student).order_by(models.Student.id.asc()).all()

def get_student_by_id(id: int, db: Session):
    db_student = db.query(models.Student).filter(models.Student.id == id).first()
    if not db_student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {id} not found"
        )
    return db_student

def update_student(id: int, student_update: schemas.StudentUpdate, db: Session):
    db_student = db.query(models.Student).filter(models.Student.id == id).first()
    if not db_student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {id} not found"
        )
    
    # If updating email, check if email is already taken by another student
    update_data = student_update.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] != db_student.email:
        email_check = db.query(models.Student).filter(models.Student.email == update_data["email"]).first()
        if email_check:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student with this email already exists"
            )
            
    # Apply updates
    for key, value in update_data.items():
        setattr(db_student, key, value)
        
    db.commit()
    db.refresh(db_student)
    return db_student

def delete_student(id: int, db: Session):
    db_student = db.query(models.Student).filter(models.Student.id == id).first()
    if not db_student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {id} not found"
        )
    db.delete(db_student)
    db.commit()
    return None
