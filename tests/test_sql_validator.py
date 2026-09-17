import pytest
from app.sql_validator import validate_sql


def test_valid_select_queries():
    valid_queries = [
        "SELECT * FROM employees;",
        "SELECT employee_id, first_name, salary FROM employees WHERE salary > 50000",
        "SELECT department, AVG(salary) FROM employees GROUP BY department ORDER BY 2 DESC",
        "select count(*) from employees",
        "   SELECT * FROM employees LIMIT 10   ",
    ]
    for q in valid_queries:
        is_valid, msg = validate_sql(q)
        assert is_valid is True, f"Expected '{q}' to be valid, got {msg}"


def test_empty_query():
    is_valid, msg = validate_sql("")
    assert is_valid is False
    assert "empty" in msg.lower()

    is_valid, msg = validate_sql("   ")
    assert is_valid is False


def test_reject_dangerous_keywords():
    dangerous_queries = [
        "DROP TABLE employees;",
        "DELETE FROM employees WHERE employee_id = 1",
        "INSERT INTO employees (first_name) VALUES ('Hacker')",
        "UPDATE employees SET salary = 1000000",
        "ALTER TABLE employees ADD COLUMN test TEXT",
        "TRUNCATE TABLE employees",
        "PRAGMA table_info(employees)",
        "ATTACH DATABASE 'evil.db' AS evil",
    ]
    for q in dangerous_queries:
        is_valid, msg = validate_sql(q)
        assert is_valid is False, f"Expected '{q}' to be rejected"


def test_reject_multiple_statements():
    multiple_statements = [
        "SELECT * FROM employees; DROP TABLE employees;",
        "SELECT 1; SELECT 2;",
    ]
    for q in multiple_statements:
        is_valid, msg = validate_sql(q)
        assert is_valid is False
        assert "multiple" in msg.lower()
