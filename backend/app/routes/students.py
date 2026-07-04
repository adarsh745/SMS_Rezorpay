from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, models, auth
from ..controllers import student_controller

router = APIRouter(prefix="/api/students", tags=["Students"])

@router.post("", response_model=schemas.StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student: schemas.StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return student_controller.create_student(student, db)

@router.get("", response_model=List[schemas.StudentResponse])
def get_all_students(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return student_controller.get_all_students(db)

@router.get("/{id}", response_model=schemas.StudentResponse)
def get_student_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return student_controller.get_student_by_id(id, db)

@router.put("/{id}", response_model=schemas.StudentResponse)
def update_student(
    id: int,
    student_update: schemas.StudentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return student_controller.update_student(id, student_update, db)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return student_controller.delete_student(id, db)
