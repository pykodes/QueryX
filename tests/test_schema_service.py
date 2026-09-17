import pytest
from app.services.schema_service import SchemaService


def test_schema_service_tables():
    service = SchemaService()
    tables = service.get_table_names()
    assert "employees" in tables


def test_schema_service_columns():
    service = SchemaService()
    schema = service.get_schema()
    assert "employees" in schema
    columns = [col["name"] for col in schema["employees"]]
    assert "employee_id" in columns
    assert "first_name" in columns
    assert "last_name" in columns
    assert "salary" in columns
    assert "department" in columns


def test_schema_summary():
    service = SchemaService()
    summary = service.get_schema_summary()
    assert "Table 'employees'" in summary
    assert "salary" in summary
