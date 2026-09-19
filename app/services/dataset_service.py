import csv
import sqlite3
from pathlib import Path


class DatasetService:

    def __init__(self , db_path:
str | Path):
        self.db_path = Path(db_path)        

    def read_csv(self, csv_path: str | Path) -> tuple[list[str], list[dict]]:
        csv_path = Path(csv_path)

        if not csv_path.exists():
            raise FileNotFoundError(
                f"CSV file not found: {csv_path}"
            )

        with open(
            csv_path,
            "r",
            encoding="utf-8-sig",
            newline=""
        ) as file:

            reader = csv.DictReader(file)

            if not reader.fieldnames:
                raise ValueError(
                    "CSV file must contain a header row."
                )

            columns = [
                column.strip()
                for column in reader.fieldnames
                if column and column.strip()
            ]

            rows = list(reader)

        return columns, rows
    def import_csv(
        self,
        csv_path: str | Path,
        table_name: str
    ) -> dict:

        columns, rows = self.read_csv(csv_path)

        if not table_name.isidentifier():
            raise ValueError("Invalid table name.")

        connection = sqlite3.connect(str(self.db_path))

        try:
            column_definitions = ", ".join(
                f'"{column}" TEXT'
                for column in columns
            )

            connection.execute(
                f'DROP TABLE IF EXISTS "{table_name}"'
            )

            connection.execute(
                f'CREATE TABLE "{table_name}" ({column_definitions})'
            )

            placeholders = ", ".join("?" for _ in columns)

            column_names = ", ".join(
                f'"{column}"'
                for column in columns
            )

            connection.executemany(
                f'''
                INSERT INTO "{table_name}" ({column_names})
                VALUES ({placeholders})
                ''',
                [
                    [row.get(column, "") for column in columns]
                    for row in rows
                ]
            )

            connection.commit()

            return {
                "table_name": table_name,
                "columns": columns,
                "row_count": len(rows),
            }

        finally:
            connection.close()
    