# Three-Tier Project Structure

This project is organized into three layers:

- Frontend: React + Vite app for the user interface
- Backend: API services and business logic
- Database: schema and persistence layer

## Structure

```text
queryX.py/
├── frontend/         # React front-end application
├── backend/          # API and server-side logic
├── database/         # DB schema and migration files
├── .venv/            # Python virtual environment
├── main.py           # Python entry point
└── README.md         # Project overview
```

## Start the frontend

```bash
cd frontend
npm install
npm run dev
```

## Start the backend

Create your API server in the backend folder and run it separately.

## Database

Add your SQL schema and migration scripts in the database folder.
