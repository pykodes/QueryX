import os
import time
from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

from app.sql_validator import validate_sql
from app.llm import get_llm
from app.services import QueryService, SchemaService, ChartService


app = FastAPI()

# PATH CONFIGURATION

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "database" / "company.db"
FRONTEND_DIR = BASE_DIR / "frontend"

# MODULE-LEVEL SERVICE INSTANCES

schema_service = SchemaService()
chart_service = ChartService()


# REQUEST MODEL

class QuestionRequest(BaseModel):
    question: str
    provider: str | None = None

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Question cannot be empty")
        return value.strip()


# RESPONSE MODEL

class QueryResponse(BaseModel):
    question: str
    generated_sql: str | None = None
    rows: list[dict] = Field(default_factory=list)
    row_count: int = 0
    answer: str | None = None
    chart: dict | None = None
    error: str | None = None
    execution_time_ms: float = 0.0


# DATABASE CONNECTION

def get_database_connection():
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database company.db not found at {DB_PATH}")
    connection = sqlite3.connect(str(DB_PATH))
    connection.row_factory = sqlite3.Row
    return connection


# EXECUTE SQL

def execute_sql(sql: str) -> dict:
    is_valid, message = validate_sql(sql)

    if not is_valid:
        return {
            "rows": [],
            "error": message,
        }

    connection = get_database_connection()
    try:
        cursor = connection.execute(sql)
        rows = cursor.fetchall()

        return {
            "rows": [dict(row) for row in rows],
            "error": None,
        }
    except sqlite3.Error as error:
        return {
            "rows": [],
            "error": f"SQL execution failed: {error}",
        }
    finally:
        connection.close()


# PROCESS QUESTION (END-TO-END PIPELINE)

def process_question(question: str, provider: str | None = None) -> dict:
    start_time = time.perf_counter()

    try:
        # Step 1: Initialize LLM and QueryService
        llm = get_llm(provider)
        query_service = QueryService(llm=llm, schema_service=schema_service)

        # Step 2: Generate SQL from natural language
        generated_sql = query_service.generate_sql(question)
        if not generated_sql:
            elapsed = (time.perf_counter() - start_time) * 1000
            return {
                "generated_sql": None,
                "rows": [],
                "row_count": 0,
                "answer": None,
                "chart": None,
                "error": "Failed to translate question to SQL.",
                "execution_time_ms": round(elapsed, 2),
            }

        # Step 3: Validate the generated SQL
        is_valid, validation_msg = validate_sql(generated_sql)
        if not is_valid:
            elapsed = (time.perf_counter() - start_time) * 1000
            return {
                "generated_sql": generated_sql,
                "rows": [],
                "row_count": 0,
                "answer": None,
                "chart": None,
                "error": f"SQL Safety Check Failed: {validation_msg}",
                "execution_time_ms": round(elapsed, 2),
            }

        # Step 4: Execute SQL against Database
        db_result = execute_sql(generated_sql)
        if db_result["error"]:
            elapsed = (time.perf_counter() - start_time) * 1000
            return {
                "generated_sql": generated_sql,
                "rows": [],
                "row_count": 0,
                "answer": None,
                "chart": None,
                "error": db_result["error"],
                "execution_time_ms": round(elapsed, 2),
            }

        rows = db_result["rows"]
        row_count = len(rows)

        # Step 5: Synthesize conversational answer
        answer = query_service.generate_answer(question, generated_sql, rows)

        # Step 6: Generate visual chart configuration if applicable
        chart = chart_service.generate_chart_config(rows, title=question)

        elapsed = (time.perf_counter() - start_time) * 1000

        return {
            "generated_sql": generated_sql,
            "rows": rows,
            "row_count": row_count,
            "answer": answer,
            "chart": chart,
            "error": None,
            "execution_time_ms": round(elapsed, 2),
        }

    except Exception as e:
        elapsed = (time.perf_counter() - start_time) * 1000
        return {
            "generated_sql": None,
            "rows": [],
            "row_count": 0,
            "answer": None,
            "chart": None,
            "error": f"Pipeline processing error: {e}",
            "execution_time_ms": round(elapsed, 2),
        }


# API ROUTES

@app.post("/ask", response_model=QueryResponse)
def ask_database(request: QuestionRequest):
    result = process_question(request.question, request.provider)

    return {
        "question": request.question,
        "generated_sql": result["generated_sql"],
        "rows": result["rows"],
        "row_count": result["row_count"],
        "answer": result["answer"],
        "chart": result["chart"],
        "error": result["error"],
        "execution_time_ms": result["execution_time_ms"],
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "QueryX",
        "database": "connected" if DB_PATH.exists() else "missing",
    }


@app.get("/database-test")
def database_test():
    connection = get_database_connection()
    try:
        tables = connection.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
        ).fetchall()
        return {
            "tables": [table["name"] for table in tables],
            "status": "connected",
        }
    finally:
        connection.close()


@app.get("/employees-test")
def employees_test():
    connection = get_database_connection()
    try:
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
        return {
            "employees": [dict(emp) for emp in employees]
        }
    finally:
        connection.close()


@app.get("/api/schema")
def get_schema():
    try:
        schema = schema_service.get_schema()
        return {
            "schema": schema,
            "error": None,
        }
    except Exception as error:
        return {
            "schema": {},
            "error": str(error),
        }


# FRONTEND WEB UI SERVING

if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    def serve_index():
        index_file = FRONTEND_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"message": "QueryX backend is running. Frontend index.html not found."}
else:
    @app.get("/")
    def home():
        return {"message": "QueryX backend is running"}
