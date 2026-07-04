from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, auth

def signup_user(user_data: schemas.UserCreate, db: Session):
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password and store user
    hashed = auth.hash_password(user_data.password)
    new_user = models.User(email=user_data.email, hashed_password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def login_user(user_credentials: schemas.UserLogin, db: Session):
    # Authenticate user credentials
    db_user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    if not db_user or not auth.verify_password(user_credentials.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}
