from pydantic import BaseModel, EmailStr, field_validator


class Address(BaseModel):
    id: str
    label: str
    fullName: str
    street: str
    city: str
    zip: str
    country: str
    isDefault: bool = False


class AddressInput(BaseModel):
    label: str
    fullName: str
    street: str
    city: str
    zip: str
    country: str
    isDefault: bool = False


class PublicUser(BaseModel):
    id: str
    email: str
    name: str
    role: str
    addresses: list[Address]


class RegisterInput(BaseModel):
    email: EmailStr
    password: str
    name: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if len(value) < 8 or not any(ch.isdigit() for ch in value):
            raise ValueError("Password must be at least 8 characters and contain a digit.")
        return value

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Name is required.")
        return value.strip()


class LoginInput(BaseModel):
    email: str
    password: str


class UpdateProfileInput(BaseModel):
    name: str


class AuthResponse(BaseModel):
    token: str
    user: PublicUser
