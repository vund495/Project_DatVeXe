from datetime import datetime
from pydantic import Field, field_validator, EmailStr

from .camel import CamelModel


class CreateUserRequest(CamelModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    role: str = Field(default="user", pattern="^(user|admin)$")
    permissions: str = Field(default="", max_length=500)


class UpdateUserRequest(CamelModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    role: str | None = Field(None, pattern="^(user|admin)$")
    permissions: str | None = Field(None, max_length=500)


class UserResponse(CamelModel):
    id: int
    name: str
    email: str
    role: str
    permissions: str


class CreateTripRequest(CamelModel):
    route_id: int = Field(..., gt=0)
    operator_id: int = Field(..., gt=0)
    departure_time: datetime
    price: int = Field(..., gt=0)
    total_seats: int = Field(default=34, ge=1, le=100)

    @field_validator("price")
    @classmethod
    def validate_price(cls, v):
        if v < 10000 or v > 10000000:
            raise ValueError("Price must be between 10,000 and 10,000,000")
        return v


class UpdateTripRequest(CamelModel):
    departure_time: datetime | None = None
    price: int | None = Field(None, gt=0)
    total_seats: int | None = Field(None, ge=1, le=100)

    @field_validator("price")
    @classmethod
    def validate_price(cls, v):
        if v is not None and (v < 10000 or v > 10000000):
            raise ValueError("Price must be between 10,000 and 10,000,000")
        return v
