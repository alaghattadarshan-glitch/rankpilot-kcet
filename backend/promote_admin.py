import sys
from app.db.database import SessionLocal
from app.models.user import User

def promote_user(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Error: User with email '{email}' not found.")
            sys.exit(1)
        
        user.role = "admin"
        db.commit()
        print(f"Success: User '{email}' has been promoted to admin role.")
    except Exception as e:
        print(f"Error promoting user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py <email>")
        sys.exit(1)
    
    email_to_promote = sys.argv[1]
    promote_user(email_to_promote)
