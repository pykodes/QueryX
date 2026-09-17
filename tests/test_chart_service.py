import pytest
from app.services.chart_service import ChartService


def test_chart_service_bar_generation():
    service = ChartService()
    rows = [
        {"department": "Engineering", "employee_count": 28},
        {"department": "Sales", "employee_count": 22},
        {"department": "Marketing", "employee_count": 15},
    ]
    config = service.generate_chart_config(rows, title="Employee Count by Department")
    assert config is not None
    assert config["type"] in ["bar", "doughnut"]
    assert config["labels"] == ["Engineering", "Sales", "Marketing"]
    assert len(config["datasets"]) == 1
    assert config["datasets"][0]["data"] == [28, 22, 15]


def test_chart_service_single_row():
    service = ChartService()
    rows = [{"count": 100}]
    config = service.generate_chart_config(rows)
    assert config is None


def test_chart_service_no_numeric_columns():
    service = ChartService()
    rows = [
        {"name": "Alice", "city": "Mumbai"},
        {"name": "Bob", "city": "Bengaluru"},
    ]
    config = service.generate_chart_config(rows)
    assert config is None
