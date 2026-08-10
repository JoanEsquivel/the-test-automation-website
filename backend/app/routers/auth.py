from fastapi import APIRouter, Depends, Request, Response

from app.core.errors import ApiError
from app.core.security import create_token, get_current_user, hash_password, verify_password
from app.schemas.auth import (
    Address,
    AddressInput,
    AuthResponse,
    LoginInput,
    PublicUser,
    RegisterInput,
    UpdateProfileInput,
)
from app.store.memory import MemoryStore, new_id

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _store(request: Request) -> MemoryStore:
    return request.app.state.store


def _public(user: dict) -> PublicUser:
    return PublicUser(**user)


@router.post("/register", status_code=201, response_model=AuthResponse)
def register(body: RegisterInput, request: Request) -> AuthResponse:
    store = _store(request)
    if store.user_by_email(body.email):
        raise ApiError(409, "EMAIL_TAKEN", "An account with this email already exists.")
    user = {
        "id": new_id("user"),
        "email": body.email,
        "passwordHash": hash_password(body.password),
        "name": body.name,
        "role": "customer",
        "addresses": [],
    }
    store.users[user["id"]] = user
    return AuthResponse(token=create_token(user), user=_public(user))


@router.post("/login", response_model=AuthResponse)
def login(body: LoginInput, request: Request) -> AuthResponse:
    user = _store(request).user_by_email(body.email)
    if user is None or not verify_password(body.password, user["passwordHash"]):
        raise ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.")
    return AuthResponse(token=create_token(user), user=_public(user))


@router.post("/logout", status_code=204)
def logout(_: dict = Depends(get_current_user)) -> Response:
    # JWTs are stateless; the client simply discards the token.
    return Response(status_code=204)


@router.get("/me", response_model=PublicUser)
def me(user: dict = Depends(get_current_user)) -> PublicUser:
    return _public(user)


@router.put("/me", response_model=PublicUser)
def update_profile(body: UpdateProfileInput, user: dict = Depends(get_current_user)) -> PublicUser:
    user["name"] = body.name.strip()
    return _public(user)


@router.post("/me/addresses", status_code=201, response_model=Address)
def add_address(body: AddressInput, user: dict = Depends(get_current_user)) -> Address:
    address = {"id": new_id("addr"), **body.model_dump()}
    if address["isDefault"]:
        for existing in user["addresses"]:
            existing["isDefault"] = False
    user["addresses"].append(address)
    return Address(**address)


@router.put("/me/addresses/{address_id}", response_model=Address)
def update_address(address_id: str, body: AddressInput, user: dict = Depends(get_current_user)) -> Address:
    address = next((a for a in user["addresses"] if a["id"] == address_id), None)
    if address is None:
        raise ApiError(404, "NOT_FOUND", f"Address '{address_id}' was not found.")
    if body.isDefault:
        for existing in user["addresses"]:
            existing["isDefault"] = False
    address.update(body.model_dump())
    return Address(**address)


@router.delete("/me/addresses/{address_id}", status_code=204)
def delete_address(address_id: str, user: dict = Depends(get_current_user)) -> Response:
    if not any(a["id"] == address_id for a in user["addresses"]):
        raise ApiError(404, "NOT_FOUND", f"Address '{address_id}' was not found.")
    user["addresses"] = [a for a in user["addresses"] if a["id"] != address_id]
    return Response(status_code=204)
