from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas
from ..controllers import auth_controller

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    return auth_controller.signup_user(user_data, db)

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    return auth_controller.login_user(user_credentials, db)

@router.post("/swagger-login", response_model=schemas.Token)
def swagger_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user_credentials = schemas.UserLogin(email=form_data.username, password=form_data.password)
    return auth_controller.login_user(user_credentials, db)

