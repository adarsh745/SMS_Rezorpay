from app.database import engine
from sqlalchemy import text

def migrate():
    print("Connecting to database and running migration...")
    with engine.begin() as conn:
        # Add columns to students table if they don't exist
        try:
            conn.execute(text("ALTER TABLE students ADD COLUMN total_fee INTEGER DEFAULT 50000;"))
            print("Added total_fee column")
        except Exception as e:
            print("total_fee might already exist:", e)

        try:
            conn.execute(text("ALTER TABLE students ADD COLUMN paid_fee INTEGER DEFAULT 0;"))
            print("Added paid_fee column")
        except Exception as e:
            print("paid_fee might already exist:", e)

        try:
            conn.execute(text("ALTER TABLE students ADD COLUMN due_fee INTEGER DEFAULT 50000;"))
            print("Added due_fee column")
        except Exception as e:
            print("due_fee might already exist:", e)

        # Create payments table if not exists (although create_all does this, doing it explicitly here too)
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS payments (
                    id SERIAL PRIMARY KEY,
                    student_id INTEGER REFERENCES students(id),
                    amount INTEGER NOT NULL,
                    currency VARCHAR DEFAULT 'INR',
                    razorpay_order_id VARCHAR UNIQUE NOT NULL,
                    razorpay_payment_id VARCHAR UNIQUE,
                    razorpay_signature VARCHAR,
                    status VARCHAR DEFAULT 'PENDING',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """))
            print("Ensured payments table exists")
        except Exception as e:
            print("Error creating payments table:", e)

if __name__ == "__main__":
    migrate()
