import sqlite3


class SchemaService:

    def __init__(self, db_path: str = "database/company.db"):
        self.db_path = db_path

    def get_schema(self) -> dict:
        connection = sqlite3.connect(self.db_path)

        tables = connection.execute(
            "SELECT name FROM sqlite_master "
            "WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        ).fetchall()

        schema = {}

        for (table_name,) in tables:
            columns = connection.execute(
                f"PRAGMA table_info({table_name})"
            ).fetchall()

            schema[table_name] = [
                {
                    "name": column[1],
                    "type": column[2]
                }
                for column in columns
            ]

        connection.close()

        return schema