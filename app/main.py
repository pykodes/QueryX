import os
import time
from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from app.sql_validator import validate_sql
from app.llm import get_llm
from app.services import QueryService, SchemaService, ChartService, DatasetService


app = FastAPI(title="QueryX API", version="1.0.0")

# CORS CONFIGURATION
# Allows frontend running on localhost or network IP to access the API directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Network IP — allows access from other devices on the same LAN
        "http://192.168.29.170:5173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PATH CONFIGURATION

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "database" / "company.db"

# MODULE-LEVEL SERVICE INSTANCES

schema_service = SchemaService()
chart_service = ChartService()
dataset_service = DatasetService(DB_PATH)

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
                "error": "Invalid input. Please enter a valid database question.",
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
@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected.")

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported."
        )

    temp_file = None

    try:
        import tempfile

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".csv"
        ) as temp:
            temp.write(await file.read())
            temp_file = temp.name

        result = dataset_service.import_csv(
            temp_file,
            "uploaded_data"
        )

        return {
            "message": "Dataset uploaded successfully.",
            "table_name": result["table_name"],
            "columns": result["columns"],
            "row_count": result["row_count"],
        }

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    finally:
        if temp_file:
            from pathlib import Path
            Path(temp_file).unlink(missing_ok=True)
@app.post("/api/ask", response_model=QueryResponse)
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


@app.get("/api/sample-questions")
def get_sample_questions():
    return {
        "questions": [
            "Who are the highest paid employees?",
            "What is the average salary by department?",
            "What is the employee distribution across work locations?",
            "List all employees in engineering",
            "Show total salary expense by department",
        ]
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


# DEDICATED BACKEND API ROOT

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "QueryX Backend API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "endpoints": {
            "health": "/api/health",
            "schema": "/api/schema",
            "ask": "/api/ask",
            "sample_questions": "/api/sample-questions",
            "employees_test": "/employees-test",
            "database_test": "/database-test",
        },
    }
