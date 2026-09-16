from fastapi import FastAPI
from pydantic import BaseModel, Field, field_validator
import sqlite3

from sql_validator import validate_sql


app = FastAPI()


class QuestionRequest(BaseModel):
    question: str

    @field_validator("question")
    @classmethod
    def validate_question(cls, value):
        if not value.strip():
            raise ValueError("Question cannot be empty")

        return value.strip()


class QueryResponse(BaseModel):
    question: str
    generated_sql: str | None = None
    rows: list[dict] = Field(default_factory=list)
    answer: str | None = None
    error: str | None = None


@app.get("/")
def home():
    return {
        "message": "AskDB backend is running"
    }


def get_database_connection():
    connection = sqlite3.connect("company.db")
    connection.row_factory = sqlite3.Row
    return connection


@app.get("/database-test")
def database_test():
    connection = get_database_connection()

    tables = connection.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()

    connection.close()

    return {
        "tables": [table["name"] for table in tables]
    }


@app.get("/employees-test")
def employees_test():
    connection = get_database_connection()

    employees = connection.execute(
        """
        SELECT
            employee_id,
            first_name,
            last_name,
            department,
            designation,
            salary,
            experience,
            city,
            state,
            employment_type,
            work_location,
            status
        FROM employees
        LIMIT 5
        """
    ).fetchall()

    connection.close()

    return {
        "employees": [dict(employee) for employee in employees]
    }



def process_question(question: str):
    test_sql = "SELECT * FROM customers"

    is_valid, message = validate_sql(test_sql)

    return {
        "generated_sql": test_sql,
        "is_valid": is_valid,
        "message": message
    }


@app.post("/ask", response_model=QueryResponse)
def ask_database(request: QuestionRequest):
    result = process_question(request.question)

    if not result["is_valid"]:
        return {
            "question": request.question,
            "generated_sql": result["generated_sql"],
            "rows": [],
            "answer": None,
            "error": result["message"]
        }

    return {
        "question": request.question,
        "generated_sql": result["generated_sql"],
        "rows": [],
        "answer": result["message"],
        "error": None
    }