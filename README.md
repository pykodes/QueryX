# QueryX
USE_CASE : Ask the Database in Plain English.

A system that allows users to query databases using plain English.

Overall architecture of the project:
QueryX/
│
├── README.md
├── .gitignore
├── .env.example
├── requirements.txt
├── pyproject.toml
│
├── app/
│   ├── __init__.py
│   │
│   ├── api/
│   ├── core/
│   ├── domain/
│   ├── services/
│   ├── infrastructure/
│   └── prompts/
│
├── frontend/
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── README.md
│
├── tests/
│
└── docs/