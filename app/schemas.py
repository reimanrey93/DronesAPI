from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class DroneStatus(str, Enum):
    available = "available"
    in_mission = "in_mission"
    maintenance = "maintenance"


class DroneBase(BaseModel):
    serial_number: str = Field(min_length=1, max_length=64)
    model: str = Field(min_length=1, max_length=100)
    status: DroneStatus = DroneStatus.available
    battery_level: int = Field(default=100, ge=0, le=100)
    location: str | None = Field(default=None, max_length=150)
    notes: str | None = None


class DroneCreate(DroneBase):
    pass


class DroneUpdate(DroneBase):
    pass


class DroneRead(DroneBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
