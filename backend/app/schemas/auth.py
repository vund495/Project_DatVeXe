from pydantic import EmailStr, field_validator

from .camel import CamelModel


class RegisterRequest(CamelModel):
    email: EmailStr
    password: str
    name: str
    phone: str = ""

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if v and not v.replace(" ", "").replace("-", "").isdigit():
            raise ValueError("Phone number must contain only digits, spaces, or dashes")
        if v and len(v.replace(" ", "").replace("-", "")) < 10:
            raise ValueError("Phone number must be at least 10 digits")
        return v


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class TokenResponse(CamelModel):
    access_token: str
    refresh_token: str
    user: "UserOut"


class UserOut(CamelModel):
    id: int
    email: str
    name: str
    phone: str
    role: str
    permissions: str = ""

