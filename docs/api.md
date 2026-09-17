# QueryX REST API Documentation

## Base URL
Default: `http://localhost:8000`

---

## Endpoints

### 1. Execute Natural Language Query
- **URL**: `/ask`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request Body:
```json
{
  "question": "What is the average salary by department?",
  "provider": "gemini"
}
```
*Note: `provider` is optional (`gemini`, `openai`, or `mock`). If omitted, uses server default.*

#### Success Response (`200 OK`):
```json
{
  "question": "What is the average salary by department?",
  "generated_sql": "SELECT department, COUNT(*) AS employee_count, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY department ORDER BY avg_salary DESC;",
  "rows": [
    {
      "department": "Engineering",
      "employee_count": 28,
      "avg_salary": 95420.50
    },
    {
      "department": "Finance",
      "employee_count": 18,
      "avg_salary": 88100.00
    }
  ],
  "row_count": 2,
  "answer": "Engineering has the highest average salary at 95,420.50 with 28 employees, followed by Finance at 88,100.00.",
  "chart": {
    "type": "bar",
    "title": "Avg Salary by Department",
    "labels": ["Engineering", "Finance"],
    "datasets": [
      {
        "label": "Avg Salary",
        "data": [95420.50, 88100.00]
      }
    ]
  },
  "error": null,
  "execution_time_ms": 42.15
}
```

#### Error Response (`200 OK` with error message or `422 Unprocessable Entity`):
```json
{
  "question": "DROP TABLE employees;",
  "generated_sql": "DROP TABLE employees;",
  "rows": [],
  "row_count": 0,
  "answer": null,
  "chart": null,
  "error": "SQL Safety Check Failed: Forbidden SQL keyword: drop",
  "execution_time_ms": 1.2
}
```

---

### 2. System Health
- **URL**: `/api/health`
- **Method**: `GET`

#### Response (`200 OK`):
```json
{
  "status": "healthy",
  "service": "QueryX",
  "database": "connected"
}
```

---

### 3. Database Schema
- **URL**: `/api/schema`
- **Method**: `GET`

#### Response (`200 OK`):
```json
{
  "tables": ["employees"],
  "schema": {
    "employees": [
      {"name": "employee_id", "type": "INTEGER", "pk": true, "notnull": false},
      {"name": "first_name", "type": "TEXT", "pk": false, "notnull": true},
      {"name": "salary", "type": "REAL", "pk": false, "notnull": true}
    ]
  }
}
```

---

### 4. Curated Sample Inquiries
- **URL**: `/api/sample-questions`
- **Method**: `GET`

#### Response (`200 OK`):
```json
{
  "questions": [
    "Show the top 5 highest paid employees with their department and salary",
    "What is the average salary and employee count by department?",
    "How many employees are in each work location?"
  ]
}
```
