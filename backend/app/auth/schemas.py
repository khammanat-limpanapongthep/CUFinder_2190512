import re

from pydantic import BaseModel, field_validator

CU_EMAIL_REGEX = re.compile(r"^[^@\s]+@(student\.)?chula\.ac\.th$")


class LoginRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_cu_email(cls, v: str) -> str:
        if not CU_EMAIL_REGEX.match(v):
            raise ValueError(
                "Email must be a valid CU address (@chula.ac.th or @student.chula.ac.th)."
            )
        return v.lower()
