from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Drone
from app.schemas import DroneCreate, DroneRead, DroneStatus, DroneUpdate


router = APIRouter(prefix="/api/drones", tags=["drones"])
DbSession = Annotated[Session, Depends(get_db)]


def get_drone_or_404(db: Session, drone_id: int) -> Drone:
    drone = db.get(Drone, drone_id)
    if drone is None:
        raise HTTPException(status_code=404, detail="Drone not found")
    return drone


@router.get("", response_model=list[DroneRead])
def list_drones(
    db: DbSession,
    search: Annotated[str | None, Query(max_length=100)] = None,
    drone_status: Annotated[DroneStatus | None, Query(alias="status")] = None,
) -> list[Drone]:
    query = select(Drone).order_by(Drone.id.desc())
    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(Drone.serial_number.ilike(pattern), Drone.model.ilike(pattern))
        )
    if drone_status:
        query = query.where(Drone.status == drone_status.value)
    return list(db.scalars(query).all())


@router.get("/{drone_id}", response_model=DroneRead)
def read_drone(drone_id: int, db: DbSession) -> Drone:
    return get_drone_or_404(db, drone_id)


@router.post("", response_model=DroneRead, status_code=status.HTTP_201_CREATED)
def create_drone(drone: DroneCreate, db: DbSession) -> Drone:
    record = Drone(**drone.model_dump())
    db.add(record)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="A drone with this serial number already exists"
        ) from exc
    db.refresh(record)
    return record


@router.put("/{drone_id}", response_model=DroneRead)
def update_drone(drone_id: int, drone: DroneUpdate, db: DbSession) -> Drone:
    record = get_drone_or_404(db, drone_id)
    for field, value in drone.model_dump().items():
        setattr(record, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="A drone with this serial number already exists"
        ) from exc
    db.refresh(record)
    return record


@router.delete("/{drone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_drone(drone_id: int, db: DbSession) -> Response:
    record = get_drone_or_404(db, drone_id)
    db.delete(record)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
