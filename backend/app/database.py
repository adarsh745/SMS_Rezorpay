from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import DATABASE_URL

# Create the SQLAlchemy engine
# Note: postgresql driver requires psycopg2 (which is installed via psycopg2-binary)
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True  # Automatically check and reconnect to lost database connections
)

# Create SessionLocal session maker class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for declarative models
Base = declarative_base()

# DB dependency to yield session and close it automatically after requests
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
