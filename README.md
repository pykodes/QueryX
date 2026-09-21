# QueryX — Ask the Database in Plain English

QueryX is an intelligent Text-to-SQL system that empowers users to query databases using plain, conversational English without writing SQL. It leverages Large Language Models (Google Gemini, OpenAI, or offline rule-based mock engine) combined with dynamic schema introspection, rigorous SQL validation security, and interactive data visualization.

---

## 🚀 Features

- **Natural Language to SQL**: Converts natural inquiries into accurate SQLite queries.
- **Dynamic Schema Introspection**: Reads live database tables and PRAGMA metadata to provide contextual DDL to the LLM.
- **SQL Safety & Security Guardrails**: Enforces SELECT-only execution, blocks dangerous operations (`DROP`, `DELETE`, `UPDATE`, `ALTER`, `TRUNCATE`), and prevents SQL injection.
- **Conversational Synthesis**: Synthesizes tabular results into a clear 1-2 sentence business summary.
- **Smart Chart Recommendation**: Automatically analyzes column types and recommends interactive visualizations (Bar, Doughnut, Line charts).
- **Interactive Modern UI**: Sleek dark-mode dashboard with real-time query execution, copyable SQL, result table, and schema explorer.
- **Multi-Provider & Offline Fallback**: Works out of the box with `gemini`, `openai`, or zero-config `mock` mode for offline testing.

---

## 📁 Project Structure

```
QueryX/
│
├── README.md                 # Project documentation
├── .gitignore                # Ignored files (.env, .venv, etc.)
├── .env.example              # Environment variables template
├── requirements.txt          # Python dependencies
│
├── app/
│   ├── __init__.py           # Package marker
│   ├── main.py               # FastAPI server & pipeline coordinator
│   ├── sql_validator.py      # Security validator for SQL queries
│   │
│   ├── llm/                  # LLM provider adapters
│   │   ├── __init__.py       # get_llm factory with auto-fallback
│   │   ├── base.py           # Abstract BaseLLM class
│   │   ├── gemini.py         # Google GenAI Gemini adapter
│   │   ├── openai.py         # OpenAI adapter
│   │   └── mock.py           # Offline mock generator for local tests
│   │
│   └── services/             # Core business logic
│       ├── __init__.py       # Package marker
│       ├── schema_service.py # SQLite schema introspection
│       ├── query_services.py # Text-to-SQL & Answer synthesis
│       └── chart_service.py  # Visual Chart.js configuration generator
│
├── database/
│   ├── company.db            # SQLite database (100 employee records)
│   ├── schema.sql            # Table DDL definitions & indexes
│   ├── seed.sql              # 100 sample employee records
│   └── README.md             # Database documentation
│
├── frontend/                 # Standalone React + Vite Frontend application
│   ├── src/                  # React components, pages, services, styles
│   │   ├── services/api.js   # Unified API client communicating with FastAPI
│   │   ├── pages/            # Landing, Workspace, and Sign-in pages
│   │   └── components/       # UI widgets, query editor, chart & table cards
│   ├── vite.config.js        # Vite dev server configuration & /api proxy
│   └── package.json          # Frontend npm scripts and dependencies
│
├── tests/
│   ├── test_sql_validator.py # SQL security tests
│   ├── test_schema_service.py# Schema introspection tests
│   ├── test_query_service.py # Prompt & fence stripping tests
│   ├── test_chart_service.py # Visualization logic tests
│   └── test_api.py           # REST API endpoint tests
│
└── docs/
    ├── architecture.md       # Full architecture and flow details
    └── api.md                # REST API specifications
```

---

## 🛠️ Quick Start (Running Frontend & Backend Separately)

QueryX is structured as a decoupled architecture:
- **Backend API**: FastAPI running on `http://127.0.0.1:8000`
- **Frontend App**: React + Vite running on `http://localhost:5173`

The user accesses the application through the frontend (`http://localhost:5173`). Requests flow from the frontend to FastAPI backend, and data returns to the user.

```
[ User in Browser ] 
        │
        ▼
[ Frontend: http://localhost:5173 ]
        │  (POST /api/ask, GET /api/health)
        ▼
[ FastAPI Backend: http://127.0.0.1:8000 ]
        │
   SQLite & LLM
        │
        ▼
[ Returned JSON -> Rendered Charts & Tables -> User ]
```

### 1. Terminal 1: Run Backend (FastAPI)

```powershell
# From project root:
.\env\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Or simply run the helper script:
.\run-backend.bat   # or .\run-backend.ps1
```

FastAPI backend will start at:
- **API URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

---

### 2. Terminal 2: Run Frontend (React + Vite)

Open a second terminal window:

```powershell
# Navigate into the frontend folder:
cd frontend

# Start the Vite development server:
npm run dev

# (On Windows PowerShell if scripts are restricted, use: npm.cmd run dev)
# Or simply run the helper script from project root:
.\run-frontend.bat   # or .\run-frontend.ps1
```

Frontend application will start at:
- **Frontend App**: **[http://localhost:5173](http://localhost:5173)**

---

### 3. Accessing the Application

Open **[http://localhost:5173](http://localhost:5173)** in your browser.
Any question submitted in the workspace sends a request to `/api/ask` (proxied or connected to FastAPI), processes through the pipeline, and returns the generated SQL, query results, AI business summary, and interactive charts.

---

## 🧪 Running Tests

Execute the complete backend test suite with pytest:

```powershell
.\env\Scripts\python.exe -m pytest tests/ -v
```

---

## 📚 Documentation

- [Architecture & Data Flow](docs/architecture.md)
- [REST API Specifications](docs/api.md)
- [Database Schema Guide](database/README.md)