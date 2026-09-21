import os
from dotenv import load_dotenv
load_dotenv()
import time
import shutil
import uuid
from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from app.sql_validator import validate_sql
from app.llm import get_llm
from app.services import QueryService, SchemaService, ChartService, DatasetService
from app.app_db import engine, SessionLocal, Base
from app.models import User, QueryHistory, UserDatabase
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, Header, HTTPException, status
import datetime

# Ensure app.db tables (users, query_history) exist
Base.metadata.create_all(bind=engine)

# PBKDF2 avoids the bcrypt backend incompatibility on newer Python versions.
# Keep bcrypt available so users created by older deployments can still log in.
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256", "bcrypt"],
    deprecated="auto",
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
USER_DATABASE_DIR = BASE_DIR / "database" / "user_databases"
USER_DATABASE_DIR.mkdir(parents=True, exist_ok=True)

# MODULE-LEVEL SERVICE INSTANCES

schema_service = SchemaService()
chart_service = ChartService()
dataset_service = DatasetService(DB_PATH)

# REQUEST MODELS

class UserSignupRequest(BaseModel):
    fullName: str
    email: str
    password: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class QuestionRequest(BaseModel):
    question: str
    provider: str | None = None
    user_email: str | None = None
    user_id: int | None = None
    database_id: int | str = "sample"

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

def get_database_connection(db_path: Path = DB_PATH):
    if not db_path.exists():
        raise FileNotFoundError(f"Database not found at {db_path}")
    connection = sqlite3.connect(str(db_path))
    connection.row_factory = sqlite3.Row
    return connection


def resolve_database_path(database_id: int | str, user_id: int | None, db: Session) -> Path:
    if database_id in ("sample", 0, None):
        return DB_PATH

    if not user_id:
        raise HTTPException(status_code=401, detail="Sign in to use a personal database")

    try:
        database_key = int(database_id)
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=400, detail="Invalid database selection") from error

    user_database = db.query(UserDatabase).filter(
        UserDatabase.id == database_key,
        UserDatabase.user_id == user_id,
    ).first()
    if not user_database:
        raise HTTPException(status_code=404, detail="Database not found for this user")

    return Path(user_database.file_path)


# EXECUTE SQL

def execute_sql(sql: str, db_path: Path = DB_PATH) -> dict:
    is_valid, message = validate_sql(sql)

    if not is_valid:
        return {
            "rows": [],
            "error": message,
        }

    connection = get_database_connection(db_path)
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

def process_question(question: str, provider: str | None = None, db_path: Path = DB_PATH) -> dict:
    start_time = time.perf_counter()

    try:
        # Step 1: Initialize LLM and QueryService
        llm = get_llm(provider)
        selected_schema_service = SchemaService(db_path)
        query_service = QueryService(llm=llm, schema_service=selected_schema_service)

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
        db_result = execute_sql(generated_sql, db_path)
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

# Removed stray decorator; the correct endpoint is defined below as '/api/ask'
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


@app.get("/api/databases")
def list_databases(user_id: int | None = None, db: Session = Depends(get_db)):
    databases = [{"id": "sample", "name": "QueryX Sample Database", "type": "sample"}]
    if user_id:
        databases.extend(
            {
                "id": database.id,
                "name": database.name,
                "type": "personal",
            }
            for database in db.query(UserDatabase)
            .filter(UserDatabase.user_id == user_id)
            .order_by(UserDatabase.created_at.desc())
            .all()
        )
    return {"databases": databases}


@app.post("/api/databases/upload")
async def upload_database(
    file: UploadFile = File(...),
    user_id: int = Form(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Please sign in again")

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".db", ".sqlite", ".sqlite3"}:
        raise HTTPException(status_code=400, detail="Upload a SQLite database (.db, .sqlite, or .sqlite3)")

    database_id = uuid.uuid4().hex
    database_path = USER_DATABASE_DIR / f"user_{user.id}_{database_id}{suffix}"
    with database_path.open("wb") as destination:
        shutil.copyfileobj(file.file, destination)

    try:
        connection = get_database_connection(database_path)
        table_count = connection.execute(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
        ).fetchone()[0]
        connection.close()
        if table_count == 0:
            raise ValueError("The uploaded database has no user tables")

        record = UserDatabase(
            user_id=user.id,
            name=Path(file.filename).stem,
            file_path=str(database_path),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return {"id": record.id, "name": record.name, "type": "personal"}
    except Exception as error:
        database_path.unlink(missing_ok=True)
        if isinstance(error, ValueError):
            raise HTTPException(status_code=400, detail=str(error)) from error
        raise
# USER AUTHENTICATION & HISTORY ROUTES

@app.post("/api/auth/register")
def register_user(req: UserSignupRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    hashed_pw = pwd_context.hash(req.password)
    new_user = User(
        username=req.fullName.strip(),
        email=email,
        password_hash=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "id": new_user.id,
        "fullName": new_user.username,
        "email": new_user.email,
        "message": "User created successfully"
    }

@app.post("/api/auth/login")
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "id": user.id,
        "fullName": user.username,
        "email": user.email,
        "message": "Login successful"
    }

@app.get("/api/history")
def get_query_history(
    user_id: int | None = None,
    user_email: str | None = None,
    db: Session = Depends(get_db),
):
    if not user_id:
        return {"history": []}

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return {"history": []}

    if user_email and user.email != user_email.strip().lower():
        raise HTTPException(status_code=403, detail="User identity does not match")

    records = db.query(QueryHistory).filter(QueryHistory.user_id == user.id).order_by(QueryHistory.created_at.desc()).limit(50).all()
    return {
        "user": {
            "id": user.id,
            "fullName": user.username,
            "email": user.email,
        },
        "history": [
            {
                "id": r.id,
                "question": r.question,
                "answer": r.answer,
                "generated_sql": r.generated_sql,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in records
        ]
    }

@app.post("/ask", response_model=QueryResponse)
@app.post("/api/ask", response_model=QueryResponse)  # Main ask endpoint
def ask_database(request: QuestionRequest, db: Session = Depends(get_db)):
    selected_db_path = resolve_database_path(request.database_id, request.user_id, db)
    result = process_question(request.question, request.provider, selected_db_path)

    # Save history only for an existing persisted user; never store credentials here.
    if request.user_id:
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Please sign in again")
        if request.user_email and user.email != request.user_email.strip().lower():
            raise HTTPException(status_code=403, detail="User identity does not match")

        history_entry = QueryHistory(
            user_id=user.id,
            question=request.question,
            answer=result.get("answer"),
            generated_sql=result.get("generated_sql"),
        )
        db.add(history_entry)
        db.commit()

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
def get_schema(
    database_id: int | str = "sample",
    user_id: int | None = None,
    db: Session = Depends(get_db),
):
    try:
        selected_db_path = resolve_database_path(database_id, user_id, db)
        schema = SchemaService(selected_db_path).get_schema()
        return {
            "schema": schema,
            "error": None,
        }
    except HTTPException:
        raise
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
