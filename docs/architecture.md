# QueryX System Architecture & Flow

## 1. Overview
**QueryX** ("Ask the Database in Plain English") is a production-ready Text-to-SQL system designed to translate natural language inquiries into secure, performant SQLite queries, execute them safely against the target database, and return both conversational insights and rich visual charts.

```
┌────────────────────────────────────────────────────────────┐
│                    Web Frontend (UI)                       │
│  - Input bar with Sample Chips                             │
│  - Tabular Results View & Chart.js Visualization           │
│  - SQL Inspection & Schema Explorer                        │
└────────────────────────────┬───────────────────────────────┘
                             │  HTTP POST /ask
                             ▼
┌────────────────────────────────────────────────────────────┐
│                  FastAPI Application (main.py)             │
│  - Endpoint routing & CORS Middleware                      │
│  - Request validation via Pydantic                         │
│  - Static file serving for Frontend UI                     │
└────────────────────────────┬───────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌─────────────────────────┐       ┌──────────────────────────┐
│     SchemaService       │       │       LLM Factory        │
│ - sqlite_master inspect │       │ - Google Gemini (GenAI)  │
│ - Schema DDL extraction │       │ - OpenAI (ChatCompl)     │
│ - Dynamic prompt inject │       │ - MockLLM (Offline test) │
└───────────┬─────────────┘       └───────────┬──────────────┘
            │                                 │
            └────────────────┬────────────────┘
                             ▼
┌────────────────────────────────────────────────────────────┐
│                     QueryService                           │
│  1. Injects schema context + question into LLM prompt      │
│  2. Cleans raw response (strips markdown fences ```sql)     │
│  3. Formulates natural language conversational synthesis   │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                    SQL Validator                           │
│  - Enforces SELECT-only queries                            │
│  - Prohibits destructive keywords (DROP, DELETE, UPDATE)   │
│  - Prevents multi-statement SQL injection attacks          │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                  SQLite Database Layer                     │
│  - database/company.db (100 employee records)              │
│  - Connection pooling with sqlite3.Row dict mapping        │
│  - database/schema.sql & database/seed.sql                 │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                    ChartService                            │
│  - Auto-detects categorical vs numerical columns           │
│  - Recommends Bar, Doughnut, or Line chart configs         │
│  - Emits Chart.js payload for instant UI rendering         │
└────────────────────────────────────────────────────────────┘
```

## 2. Directory Interconnectivity

| Directory / File | Role | Connected To |
|---|---|---|
| `app/main.py` | Central API server & pipeline coordinator | Connects `QueryService`, `SchemaService`, `ChartService`, `sql_validator`, and mounts `frontend/`. |
| `app/sql_validator.py` | Security guardrail | Called by `app/main.py` before any SQL statement reaches the database. |
| `app/llm/` | LLM abstraction & provider adapters | `get_llm()` creates `GeminiLLM`, `OpenAILLM`, or `MockLLM`, used by `QueryService`. |
| `app/services/schema_service.py` | Database introspection engine | Reads `database/company.db`, formats schema context for `QueryService` and `/api/schema`. |
| `app/services/query_services.py` | Text-to-SQL and Answer synthesizer | Combines LLM with schema context to produce SQL and conversational summaries. |
| `app/services/chart_service.py` | Data visualization recommender | Inspects query output rows and constructs Chart.js configurations. |
| `database/` | Storage & persistence | Houses SQLite `company.db`, `schema.sql`, and `seed.sql`. |
| `frontend/` | Dashboard interface | Interacts with `/ask`, `/api/schema`, and `/api/sample-questions` via `fetch()`. |
| `tests/` | Quality assurance suite | Pytest suite validating safety, schema, services, and API endpoints. |

## 3. Security Design
1. **SELECT-Only Enforcement**: Queries must begin with `SELECT`. Any statement beginning with or containing forbidden keywords (`DROP`, `DELETE`, `INSERT`, `UPDATE`, `ALTER`, `TRUNCATE`, `PRAGMA`, `ATTACH`) is blocked before database execution.
2. **Multiple Statements Blocked**: Prohibits semicolon chaining (e.g. `SELECT 1; DROP TABLE...`) to eliminate SQL injection vectors.
3. **Environment Security**: API keys are loaded via `python-dotenv` and isolated in `.env` (excluded by `.gitignore`).
