import pytest
from app.llm.mock import MockLLM
from app.services.schema_service import SchemaService
from app.services.query_services import QueryService


def test_clean_sql_markdown_fences():
    raw_markdown = "```sql\nSELECT * FROM employees;\n```"
    cleaned = QueryService.clean_sql(raw_markdown)
    assert cleaned == "SELECT * FROM employees;"

    raw_markdown_generic = "```\nSELECT salary FROM employees WHERE salary > 50000;\n```"
    cleaned = QueryService.clean_sql(raw_markdown_generic)
    assert cleaned == "SELECT salary FROM employees WHERE salary > 50000;"

    raw_backticks = "`SELECT count(*) FROM employees;`"
    cleaned = QueryService.clean_sql(raw_backticks)
    assert cleaned == "SELECT count(*) FROM employees;"


def test_query_service_mock_generation():
    llm = MockLLM()
    schema_service = SchemaService()
    query_service = QueryService(llm=llm, schema_service=schema_service)

    sql = query_service.generate_sql("Who are the top 5 highest paid employees?")
    assert "SELECT" in sql.upper()
    assert "salary" in sql.lower()
    assert "DESC" in sql.upper()
    assert "5" in sql


def test_query_service_answer_generation():
    llm = MockLLM()
    schema_service = SchemaService()
    query_service = QueryService(llm=llm, schema_service=schema_service)

    rows = [{"department": "Engineering", "avg_salary": 95000.0}]
    answer = query_service.generate_answer(
        "Average salary in Engineering",
        "SELECT department, AVG(salary) FROM employees",
        rows
    )
    assert answer is not None
    assert len(answer) > 0
