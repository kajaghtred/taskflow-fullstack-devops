
import os

from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base
from main import app, get_db

load_dotenv()

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if not TEST_DATABASE_URL:
    raise RuntimeError("TEST_DATABASE_URL environment variable is not set")

test_engine = create_engine(TEST_DATABASE_URL)

TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    autocommit=False,
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


def setup_module():
    Base.metadata.create_all(bind=test_engine)


def teardown_module():
    app.dependency_overrides.clear()
    test_engine.dispose()


client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_create_and_list_task():
    response = client.post(
        "/tasks",
        json={
            "title": "Learn Docker",
            "description": "Containerize TaskFlow",
            "priority": "high",
        },
    )

    assert response.status_code == 201
    assert response.json()["title"] == "Learn Docker"

    task_id = response.json()["id"]

    list_response = client.get("/tasks")
    assert list_response.status_code == 200
    assert any(
        task["id"] == task_id
        for task in list_response.json()
    )


def test_missing_task_returns_404():
    response = client.get("/tasks/999999")
    assert response.status_code == 404


def test_update_task_completion():
    create_response = client.post(
        "/tasks",
        json={"title": "Test task"},
    )
    assert create_response.status_code == 201

    task_id = create_response.json()["id"]

    update_response = client.patch(
        f"/tasks/{task_id}",
        params={"completed": True},
    )

    assert update_response.status_code == 200
    assert update_response.json()["completed"] is True


def test_delete_task():
    create_response = client.post(
        "/tasks",
        json={"title": "Task to delete"},
    )
    assert create_response.status_code == 201

    task_id = create_response.json()["id"]

    delete_response = client.delete(f"/tasks/{task_id}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/tasks/{task_id}")
    assert get_response.status_code == 404


def test_invalid_priority_is_rejected():
    response = client.post(
        "/tasks",
        json={
            "title": "Invalid priority task",
            "priority": "urgent",
        },
    )

    assert response.status_code == 422
