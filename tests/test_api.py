import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


def test_database_test_endpoint():
    response = client.get("/database-test")
    assert response.status_code == 200
    data = response.json()
    assert "employees" in data["tables"]


def test_employees_test_endpoint():
    response = client.get("/employees-test")
    assert response.status_code == 200
    data = response.json()
    assert len(data["employees"]) == 5


def test_api_schema():
    response = client.get("/api/schema")
    assert response.status_code == 200
    data = response.json()
    assert "schema" in data
    assert "employees" in data["schema"]  # endpoint returns {"schema": {...}}


def test_ask_endpoint_fallback_sql():
    """Ensure /ask returns valid SQL even for a generic question via MockLLM."""
    response = client.post(
        "/ask",
        json={
            "question": "Show all employees",
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["generated_sql"] is not None
    assert "SELECT" in data["generated_sql"].upper()
    assert data["error"] is None


def test_ask_endpoint_with_mock():
    response = client.post(
        "/ask",
        json={
            "question": "What is the average salary by department?",
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["generated_sql"] is not None
    assert "SELECT" in data["generated_sql"].upper()
    assert len(data["rows"]) > 0
    assert data["row_count"] > 0
    assert data["execution_time_ms"] > 0


def test_ask_endpoint_empty_question():
    response = client.post(
        "/ask",
        json={"question": "   "},
    )
    assert response.status_code == 422  # Pydantic validation error
