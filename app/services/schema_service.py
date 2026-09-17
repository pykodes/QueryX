import os
from pathlib import Path
import sqlite3


BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_PATH = BASE_DIR / "database" / "company.db"


class SchemaService:

    def __init__(self, db_path: str | Path | None = None):
        if db_path is None:
            env_path = os.getenv("DATABASE_PATH")
            if env_path:
                self.db_path = Path(env_path) if Path(env_path).is_absolute() else BASE_DIR / env_path
            else:
                self.db_path = DEFAULT_DB_PATH
        else:
            self.db_path = Path(db_path) if Path(db_path).is_absolute() else BASE_DIR / db_path

    def _get_connection(self) -> sqlite3.Connection:
        if not self.db_path.exists():
            raise FileNotFoundError(f"Database not found at path: {self.db_path}")
        connection = sqlite3.connect(str(self.db_path))
        connection.row_factory = sqlite3.Row
        return connection

    def get_table_names(self) -> list[str]:
        connection = self._get_connection()
        try:
            cursor = connection.cursor()
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
            )
            return [row["name"] for row in cursor.fetchall()]
        finally:
            connection.close()

    def get_schema(self) -> dict:
        connection = self._get_connection()
        try:
            cursor = connection.cursor()
            tables = self.get_table_names()
            schema = {}

            for table_name in tables:
                columns = cursor.execute(f"PRAGMA table_info({table_name})").fetchall()
                schema[table_name] = [
                    {
                        "name": col["name"],
                        "type": col["type"],
                        "notnull": bool(col["notnull"]),
                        "pk": bool(col["pk"]),
                    }
                    for col in columns
                ]

            return schema
        finally:
            connection.close()

    def get_schema_summary(self) -> str:
        """
        Formats schema as concise DDL-like text for prompt injection.
        """
        schema = self.get_schema()
        lines = []
        for table, cols in schema.items():
            cols_str = ", ".join([f"{col['name']} ({col['type']})" for col in cols])
            lines.append(f"Table '{table}': {cols_str}")
        return "\n".join(lines)

    def get_sample_data(self, table_name: str, limit: int = 2) -> list[dict]:
        connection = self._get_connection()
        try:
            cursor = connection.cursor()
            rows = cursor.execute(f"SELECT * FROM {table_name} LIMIT {limit}").fetchall()
            return [dict(row) for row in rows]
        finally:
            connection.close()