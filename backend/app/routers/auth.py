from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import User
from app.schemas import LoginRequest, UserPublic
from app.security import create_access_token, decode_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])
_settings = get_settings()


@router.post("/login", response_model=UserPublic)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == payload.email.lower())).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    token = create_access_token(user.id)
    response.set_cookie(
        key=_settings.cookie_name,
        value=token,
        httponly=True,
        secure=_settings.cookie_secure,
        samesite=_settings.cookie_samesite,
        max_age=_settings.access_token_ttl_minutes * 60,
        path="/",
    )
    return UserPublic(id=user.id, email=user.email, name=user.name)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=_settings.cookie_name, path="/")
    return {"ok": True}


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(_settings.cookie_name)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.get("/me", response_model=UserPublic)
def me(user: User = Depends(get_current_user)):
    return UserPublic(id=user.id, email=user.email, name=user.name)
