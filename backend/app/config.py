import os

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:adarsh%402003@localhost:5432/login_app_db"
)

# JWT Security Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretjwtkeyforloginappbackend2026")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Razorpay Configuration
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_T9VqE3ggUEkews")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "E07urcRp0j3zMXzrUvib70Z4")
