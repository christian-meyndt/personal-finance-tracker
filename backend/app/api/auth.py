from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth import authenticate_user, create_access_token, get_current_user
from app.db import get_db
from app.models.user import User
from app.schemas.auth import Token, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login_form(
    response: Response,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
) -> Token:
    """OAuth2 form-based login (for Swagger UI and API clients)"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})

    # Set httpOnly cookie for browser
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
        max_age=7 * 24 * 60 * 60,  # 7 days
    )

    return Token(access_token=access_token, token_type="bearer")


@router.post("/login/json", response_model=Token)
async def login_json(
    response: Response,
    credentials: UserLogin,
    db: Session = Depends(get_db),
) -> Token:
    """JSON-based login (for frontend Next.js app)"""
    # Support both 'username' and 'email' field names
    username = credentials.username
    user = authenticate_user(db, username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token = create_access_token(data={"sub": user.username})

    # Set httpOnly cookie for browser
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
        max_age=7 * 24 * 60 * 60,  # 7 days
    )

    return Token(access_token=access_token, token_type="bearer")


@router.post("/logout")
async def logout(response: Response) -> dict:
    """Clear the authentication cookie"""
    response.delete_cookie(key="access_token")
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)]
) -> UserResponse:
    return UserResponse.model_validate(current_user)
