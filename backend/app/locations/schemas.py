from pydantic import BaseModel, field_validator


def _normalize_name(v: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError("name cannot be empty")
    if len(v) > 200:
        raise ValueError("name must be 200 characters or fewer")
    return v


class LocationCreate(BaseModel):
    name: str
    is_dropoff: bool = True

    @field_validator("name")
    @classmethod
    def _check_name(cls, v: str) -> str:
        return _normalize_name(v)


class LocationPatch(BaseModel):
    name: str | None = None
    is_dropoff: bool | None = None
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def _check_name(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return _normalize_name(v)
