import io
import sqlite3
from uuid import uuid4

import pytest
from openpyxl import Workbook
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_dataset_upload_accepts_csv_xml_and_xlsx():
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.append(["name", "value"])
    worksheet.append(["Excel", 3])
    excel_file = io.BytesIO()
    workbook.save(excel_file)

    uploads = [
        ("records.csv", b"name,value\nCSV,1\n", "text/csv"),
        ("records.xml", b"<records><record><name>XML</name><value>2</value></record></records>", "application/xml"),
        ("records.xlsx", excel_file.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    ]

    for filename, content, content_type in uploads:
        response = client.post(
            "/api/upload",
            files={"file": (filename, content, content_type)},
        )
        assert response.status_code == 200, response.text
        assert response.json()["row_count"] == 1


def test_tabular_database_upload_is_converted_to_sqlite():
    unique_id = uuid4().hex
    user = client.post(
        "/api/auth/register",
        json={
            "fullName": f"Tabular Owner {unique_id}",
            "email": f"tabular-owner-{unique_id}@example.com",
            "password": "DatabasePass123!",
        },
    ).json()

    response = client.post(
        "/api/databases/upload",
        data={"user_id": str(user["id"])},
        files={"file": ("records.csv", b"name,value\nCSV,1\n", "text/csv")},
    )
    assert response.status_code == 200, response.text

    schema = client.get(
        f"/api/schema?database_id={response.json()['id']}&user_id={user['id']}"
    )
    assert schema.status_code == 200
    assert "uploaded_data" in schema.json()["schema"]


def test_db_database_upload_is_supported():
    unique_id = uuid4().hex
    user = client.post(
        "/api/auth/register",
        json={
            "fullName": f"SQLite Owner {unique_id}",
            "email": f"sqlite-owner-{unique_id}@example.com",
            "password": "DatabasePass123!",
        },
    ).json()

    temporary_path = "tests_native_upload.db"
    disk_database = sqlite3.connect(temporary_path)
    disk_database.execute("CREATE TABLE orders (order_id INTEGER, total INTEGER)")
    disk_database.execute("INSERT INTO orders VALUES (1, 250)")
    disk_database.commit()
    disk_database.close()
    try:
        with open(temporary_path, "rb") as database_file:
            response = client.post(
                "/api/databases/upload",
                data={"user_id": str(user["id"])},
                files={"file": ("orders.db", database_file, "application/x-sqlite3")},
            )
        assert response.status_code == 200, response.text
        assert response.json()["name"] == "orders"
    finally:
        import os

        os.remove(temporary_path)


def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


def test_api_ask_compatibility_route():
    response = client.post(
        "/api/ask",
        json={
            "question": "Show all employees",
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["generated_sql"] is not None
    assert data["error"] is None


def test_api_sample_questions_route():
    response = client.get("/api/sample-questions")
    assert response.status_code == 200
    data = response.json()
    assert "questions" in data
    assert len(data["questions"]) > 0


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


def test_logged_in_user_owns_query_history():
    unique_id = uuid4().hex
    email = f"history-{unique_id}@example.com"
    password = "HistoryPass123!"

    registration = client.post(
        "/api/auth/register",
        json={
            "fullName": f"History User {unique_id}",
            "email": email,
            "password": password,
        },
    )
    assert registration.status_code == 200
    user = registration.json()
    assert user["id"]
    assert "password" not in user
    assert "password_hash" not in user

    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    assert login.json()["id"] == user["id"]

    query = client.post(
        "/api/ask",
        json={
            "question": "Show all employees",
            "provider": "mock",
            "user_id": user["id"],
            "user_email": email,
        },
    )
    assert query.status_code == 200

    history = client.get(f"/api/history?user_id={user['id']}")
    assert history.status_code == 200
    history_data = history.json()
    assert history_data["user"]["id"] == user["id"]
    assert any(item["question"] == "Show all employees" for item in history_data["history"])
    assert all("password" not in item and "password_hash" not in item for item in history_data["history"])


def test_query_history_is_separate_between_users():
    first_id = uuid4().hex
    second_id = uuid4().hex
    users = []

    for user_id in (first_id, second_id):
        response = client.post(
            "/api/auth/register",
            json={
                "fullName": f"User {user_id}",
                "email": f"{user_id}@example.com",
                "password": "SeparatePass123!",
            },
        )
        assert response.status_code == 200
        users.append(response.json())

    response = client.post(
        "/api/ask",
        json={
            "question": "Show all employees",
            "provider": "mock",
            "user_id": users[0]["id"],
            "user_email": users[0]["email"],
        },
    )
    assert response.status_code == 200

    first_history = client.get(f"/api/history?user_id={users[0]['id']}").json()["history"]
    second_history = client.get(f"/api/history?user_id={users[1]['id']}").json()["history"]
    assert any(item["question"] == "Show all employees" for item in first_history)
    assert not any(item["question"] == "Show all employees" for item in second_history)


def test_user_can_upload_and_query_personal_database():
    unique_id = uuid4().hex
    first_user = client.post(
        "/api/auth/register",
        json={
            "fullName": f"Database Owner {unique_id}",
            "email": f"db-owner-{unique_id}@example.com",
            "password": "DatabasePass123!",
        },
    ).json()
    second_user = client.post(
        "/api/auth/register",
        json={
            "fullName": f"Other User {unique_id}",
            "email": f"db-other-{unique_id}@example.com",
            "password": "DatabasePass123!",
        },
    ).json()

    database = sqlite3.connect(":memory:")
    database.execute(
        "CREATE TABLE employees (employee_id INTEGER, first_name TEXT, last_name TEXT, "
        "department TEXT, designation TEXT, salary INTEGER)"
    )
    database.execute("INSERT INTO employees VALUES (999, 'Personal', 'User', 'Test', 'Owner', 1)")
    database.commit()
    backup_path = "tests_personal_database.db"
    disk_database = sqlite3.connect(backup_path)
    database.backup(disk_database)
    disk_database.close()
    database.close()

    try:
        with open(backup_path, "rb") as database_file:
            upload = client.post(
                "/api/databases/upload",
                data={"user_id": str(first_user["id"])},
                files={"file": ("personal.db", database_file, "application/octet-stream")},
            )
        assert upload.status_code == 200
        personal_database = upload.json()

        first_databases = client.get(f"/api/databases?user_id={first_user['id']}").json()["databases"]
        second_databases = client.get(f"/api/databases?user_id={second_user['id']}").json()["databases"]
        assert any(item["id"] == personal_database["id"] for item in first_databases)
        assert not any(item["id"] == personal_database["id"] for item in second_databases)

        schema = client.get(
            f"/api/schema?database_id={personal_database['id']}&user_id={first_user['id']}"
        )
        assert schema.status_code == 200
        assert "employees" in schema.json()["schema"]

        query = client.post(
            "/api/ask",
            json={
                "question": "Show all employees",
                "provider": "mock",
                "user_id": first_user["id"],
                "user_email": first_user["email"],
                "database_id": personal_database["id"],
            },
        )
        assert query.status_code == 200
        assert query.json()["rows"] == [{
            "employee_id": 999,
            "first_name": "Personal",
            "last_name": "User",
            "department": "Test",
            "designation": "Owner",
            "salary": 1,
        }]

        unauthorized_query = client.post(
            "/api/ask",
            json={
                "question": "Show all employees",
                "provider": "mock",
                "user_id": second_user["id"],
                "database_id": personal_database["id"],
            },
        )
        assert unauthorized_query.status_code == 404
        unauthorized_schema = client.get(
            f"/api/schema?database_id={personal_database['id']}&user_id={second_user['id']}"
        )
        assert unauthorized_schema.status_code == 404
    finally:
        import os
        os.remove(backup_path)
