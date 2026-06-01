from pydantic import BaseModel


class AuthRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
