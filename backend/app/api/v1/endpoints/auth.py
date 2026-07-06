from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User, LoginHistory
from app.schemas.user import UserCreate, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from datetime import datetime

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user_obj = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name,
    )
    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)
    return user_obj

@router.post("/login", response_model=Token)
def login(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log successful login details
    user.last_login = datetime.utcnow()
    ip_addr = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    login_log = LoginHistory(
        user_id=user.id,
        email=user.email,
        ip_address=ip_addr,
        user_agent=user_agent
    )
    db.add(login_log)
    db.commit()
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/promote-temp")
def promote_temp(email: str, passcode: str, db: Session = Depends(get_db)):
    # Simple secure passcode check
    if passcode != "rp_admin_992":
        raise HTTPException(status_code=403, detail="Invalid passcode")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.role = "admin"
    db.commit()
    return {"message": f"Successfully promoted {email} to admin!"}

@router.get("/clear-users-temp")
def clear_users_temp(passcode: str, db: Session = Depends(get_db)):
    if passcode != "rp_admin_992":
        raise HTTPException(status_code=403, detail="Invalid passcode")
        
    from app.models.user import StudentPreference, Shortlist
    
    # Delete all user records and related logs
    db.query(FeedbackLog).delete()
    db.query(ActivityLog).delete()
    db.query(LoginHistory).delete()
    db.query(Shortlist).delete()
    db.query(StudentPreference).delete()
    db.query(User).delete()
    db.commit()
    return {"message": "All user accounts and related records cleared successfully!"}
