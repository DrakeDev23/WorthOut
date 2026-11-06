from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserMeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    clerk_user_id: str
    display_name: str | None = None
    email: str | None = None
    created_at: datetime = Field(description="RFC 3339 UTC timestamp")
    updated_at: datetime = Field(description="RFC 3339 UTC timestamp")
