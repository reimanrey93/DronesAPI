import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import main
from app.database import Base, get_db


@pytest.fixture
def client(monkeypatch):
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    test_session = sessionmaker(bind=test_engine, autoflush=False, expire_on_commit=False)

    def override_get_db():
        db = test_session()
        try:
            yield db
        finally:
            db.close()

    monkeypatch.setattr(main, "engine", test_engine)
    main.app.dependency_overrides[get_db] = override_get_db
    with TestClient(main.app) as test_client:
        yield test_client
    main.app.dependency_overrides.clear()
    test_engine.dispose()


def test_drone_crud_and_duplicate_serial(client):
    payload = {
        "serial_number": "DRN-001",
        "model": "Explorer X2",
        "status": "available",
        "battery_level": 85,
        "location": "Hangar norte",
        "notes": "Vuelo de prueba",
    }

    created = client.post("/api/drones", json=payload)
    assert created.status_code == 201
    drone_id = created.json()["id"]

    assert client.post("/api/drones", json=payload).status_code == 409
    assert client.get("/api/drones?search=Explorer").json()[0]["id"] == drone_id

    update = {**payload, "status": "maintenance", "battery_level": 20}
    updated = client.put(f"/api/drones/{drone_id}", json=update)
    assert updated.status_code == 200
    assert updated.json()["status"] == "maintenance"
    assert updated.json()["battery_level"] == 20

    assert client.get(f"/api/drones/{drone_id}").status_code == 200
    assert client.delete(f"/api/drones/{drone_id}").status_code == 204
    assert client.get(f"/api/drones/{drone_id}").status_code == 404


def test_invalid_battery_is_rejected(client):
    response = client.post(
        "/api/drones",
        json={
            "serial_number": "DRN-002",
            "model": "Scout",
            "battery_level": 101,
        },
    )
    assert response.status_code == 422
