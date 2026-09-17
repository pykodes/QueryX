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
├── frontend/
│   ├── index.html            # Modern responsive web dashboard
│   ├── style.css             # Glassmorphism dark theme styling
│   └── app.js                # Frontend API & Chart.js integration
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

## 🛠️ Quick Start

### 1. Set Up Virtual Environment

```powershell
# Create virtual environment
python -m venv .venv

# Activate (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy the example configuration:
```powershell
cp .env.example .env
```

Edit `.env` to add your API keys:
```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```
*(Note: If no API key is set, QueryX automatically falls back to the built-in offline engine for common questions.)*

### 3. Run the Application

```powershell
.\.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

Open your browser and navigate to:
**[http://localhost:8000](http://localhost:8000)**

---

## 🧪 Running Tests

Execute the complete test suite with pytest:

```powershell
.\.venv\Scripts\pytest tests/ -v
```

---

## 📚 Documentation

- [Architecture & Data Flow](docs/architecture.md)
- [REST API Specifications](docs/api.md)
- [Database Schema Guide](database/README.md)