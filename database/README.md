# QueryX Database Documentation

## Database Overview
- **Database Engine**: SQLite 3
- **Database File**: `company.db`
- **Schema Definition**: `schema.sql`
- **Seed Data**: `seed.sql`

## Tables

### `employees`
Contains 100 comprehensive employee records representing a modern enterprise workforce.

| Column | Type | Description |
|---|---|---|
| `employee_id` | INTEGER PRIMARY KEY | Unique employee identifier |
| `first_name` | TEXT | First name |
| `last_name` | TEXT | Last name |
| `email` | TEXT | Corporate email address |
| `phone` | TEXT | Contact number |
| `gender` | TEXT | Gender |
| `age` | INTEGER | Age of employee |
| `date_of_birth` | TEXT | Date of birth (YYYY-MM-DD) |
| `department` | TEXT | Department (Engineering, Marketing, Sales, HR, Finance, Operations, etc.) |
| `designation` | TEXT | Role title (Software Engineer, Senior Manager, etc.) |
| `salary` | REAL | Monthly/Base salary |
| `bonus` | REAL | Performance bonus |
| `experience` | INTEGER | Total years of experience |
| `joining_date` | TEXT | Date joined company (YYYY-MM-DD) |
| `city` | TEXT | City location |
| `state` | TEXT | State location |
| `country` | TEXT | Country |
| `skills` | TEXT | Comma-separated technical/domain skills |
| `performance_score` | REAL | Score rating from 1.0 to 5.0 |
| `attendance_percentage`| REAL | Overall attendance percentage |
| `employment_type` | TEXT | Full-Time, Part-Time, Contract |
| `work_location` | TEXT | On-Site, Remote, Hybrid |
| `status` | TEXT | Active, On Leave, Resigned |
| `projects_completed` | INTEGER | Number of delivered projects |
| `sales_amount` | REAL | Sales generated |
| `total_compensation` | REAL | Total annual compensation |

## Rebuilding the Database

To rebuild or reseed the database:

```bash
# Remove existing database (if resetting)
rm database/company.db

# Apply schema and seed data
sqlite3 database/company.db < database/schema.sql
sqlite3 database/company.db < database/seed.sql
```
