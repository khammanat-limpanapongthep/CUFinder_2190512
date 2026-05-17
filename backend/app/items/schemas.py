from datetime import date as _date
from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field, field_validator, model_validator

CATEGORIES = frozenset(
    {
        "ID Cards",
        "Electronics",
        "Wallet & Cards",
        "Keys",
        "Bags & Backpacks",
        "Books & Stationery",
        "Clothing & Accessories",
        "Water Bottles",
        "Other",
    }
)


class _ItemBase(BaseModel):
    title: str
    description: str = ""
    category: str
    image_id: str | None = None

    @field_validator("title")
    @classmethod
    def _check_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("title cannot be empty")
        if len(v) > 200:
            raise ValueError("title must be 200 characters or fewer")
        return v

    @field_validator("description")
    @classmethod
    def _check_description(cls, v: str) -> str:
        v = v.strip()
        if len(v) > 2000:
            raise ValueError("description must be 2000 characters or fewer")
        return v

    @field_validator("category")
    @classmethod
    def _check_category(cls, v: str) -> str:
        if v not in CATEGORIES:
            raise ValueError(
                f"category must be one of: {', '.join(sorted(CATEGORIES))}"
            )
        return v


class LostItemCreate(_ItemBase):
    type: Literal["lost"]
    last_seen_location_id: str | None = None
    last_seen_location_text: str | None = None
    last_seen_date: str
    contact_info: str | None = None

    @field_validator("last_seen_date")
    @classmethod
    def _check_date(cls, v: str) -> str:
        try:
            _date.fromisoformat(v)
        except ValueError:
            raise ValueError("last_seen_date must be a valid ISO date (YYYY-MM-DD)")
        return v

    @model_validator(mode="after")
    def _check_location_exclusivity(self) -> "LostItemCreate":
        has_id = bool(self.last_seen_location_id)
        has_text = bool(self.last_seen_location_text)
        if has_id == has_text:
            raise ValueError(
                "Exactly one of last_seen_location_id or last_seen_location_text must be provided."
            )
        return self


class FoundItemCreate(_ItemBase):
    type: Literal["found"]
    found_location_id: str | None = None
    found_location_text: str | None = None
    found_date: str
    held_admin_location_id: str | None = None
    held_freetext: str | None = None

    @field_validator("found_date")
    @classmethod
    def _check_date(cls, v: str) -> str:
        try:
            _date.fromisoformat(v)
        except ValueError:
            raise ValueError("found_date must be a valid ISO date (YYYY-MM-DD)")
        return v

    @model_validator(mode="after")
    def _check_found_location(self) -> "FoundItemCreate":
        has_id = bool(self.found_location_id)
        has_text = bool(self.found_location_text)
        if has_id == has_text:
            raise ValueError(
                "Exactly one of found_location_id or found_location_text must be provided."
            )
        return self

    @model_validator(mode="after")
    def _check_held_location(self) -> "FoundItemCreate":
        has_id = bool(self.held_admin_location_id)
        has_text = bool(self.held_freetext)
        if has_id == has_text:
            raise ValueError(
                "Exactly one of held_admin_location_id or held_freetext must be provided."
            )
        return self


# Discriminated union — use TypeAdapter(ItemCreate).validate_python(data) in routes.
ItemCreate = Annotated[
    Union[LostItemCreate, FoundItemCreate],
    Field(discriminator="type"),
]


class StatusUpdate(BaseModel):
    status: Literal["open", "claimed", "disposed"]
