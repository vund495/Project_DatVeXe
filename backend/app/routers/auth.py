from fastapi import APIRouter, Depends, HTTPException
from pydantic import EmailStr, field_validator, BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.services import auth as auth_service
from app.services.deps import get_current_user

router = APIRouter(tags=["auth"])


class UpdateUserRequest(BaseModel):
    name: str | None = None
    phone: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if v and not v.replace(" ", "").replace("-", "").isdigit():
            raise ValueError("Phone number must contain only digits, spaces, or dashes")
        if v and len(v.replace(" ", "").replace("-", "")) < 10:
            raise ValueError("Phone number must be at least 10 digits")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


def _to_user_out(u: User) -> UserOut:
    return UserOut(id=u.id, email=u.email, name=u.name, phone=u.phone, role=u.role, permissions=u.permissions)


@router.post("/api/auth/register")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    existing = await auth_service.get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        password_hash=auth_service.hash_password(body.password),
        name=body.name,
        phone=body.phone,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return TokenResponse(
        access_token=auth_service.create_access_token(user.id),
        refresh_token=auth_service.create_refresh_token(user.id),
        user=_to_user_out(user),
    )


@router.post("/api/auth/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    user = await auth_service.get_user_by_email(db, body.email)
    if not user or not auth_service.verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenResponse(
        access_token=auth_service.create_access_token(user.id),
        refresh_token=auth_service.create_refresh_token(user.id),
        user=_to_user_out(user),
    )


@router.post("/api/auth/refresh")
async def refresh(token: str, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    payload = auth_service.decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await auth_service.get_user_by_id(db, int(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return TokenResponse(
        access_token=auth_service.create_access_token(user.id),
        refresh_token=auth_service.create_refresh_token(user.id),
        user=_to_user_out(user),
    )


@router.get("/api/auth/me")
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return _to_user_out(current_user)


@router.put("/api/auth/me")
async def update_me(
    request: UpdateUserRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    if request.name:
        current_user.name = request.name
    if request.phone is not None:
        current_user.phone = request.phone
    db.add(current_user)
    await db.flush()
    return _to_user_out(current_user)


@router.post("/api/auth/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not auth_service.verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    current_user.password_hash = auth_service.hash_password(request.new_password)
    db.add(current_user)
    await db.flush()
    
    return {"message": "Password changed successfully"}
