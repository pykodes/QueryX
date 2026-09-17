import re
import json
from app.llm.base import BaseLLM
from app.services.schema_service import SchemaService


class QueryService:

    def __init__(self, llm: BaseLLM, schema_service: SchemaService):
        self.llm = llm
        self.schema_service = schema_service

    @staticmethod
    def clean_sql(raw_output: str) -> str:
        """
        Removes markdown fences, backticks, and extra whitespace from LLM outputs.
        """
        if not raw_output:
            return ""

        text = raw_output.strip()

        # Match markdown block ```sql ... ``` or ``` ... ```
        fence_pattern = r"```(?:sql)?\s*([\s\S]*?)\s*```"
        match = re.search(fence_pattern, text, re.IGNORECASE)
        if match:
            text = match.group(1).strip()

        # Remove single backticks if wrapped
        if text.startswith("`") and text.endswith("`"):
            text = text.strip("`").strip()

        # Clean trailing explanatory text if query ends with semicolon
        if ";" in text:
            # Keep up to the first semicolon statement
            parts = text.split(";")
            text = parts[0].strip() + ";"

        return text.strip()

    def generate_sql(self, question: str) -> str:
        """
        Translates a natural language question into an executable SQLite SELECT query.
        """
        schema_summary = self.schema_service.get_schema_summary()

        prompt = f"""You are an expert SQLite database analyst.
Convert the user's natural language question into a safe, valid SQLite SELECT query.

Database Schema:
{schema_summary}

Rules:
1. Generate ONLY standard SQLite syntax.
2. ONLY generate SELECT queries. Never generate INSERT, UPDATE, DELETE, DROP, ALTER, PRAGMA.
3. Use sensible column aliasing and aggregations (e.g. COUNT, AVG, SUM, ROUND).
4. Use LIMIT when querying many records unless aggregated.
5. Return ONLY the raw SQL query. Do NOT provide explanations or wrap in markdown fences.

User question:
{question}
"""
        raw_sql = self.llm.generate(prompt)
        return self.clean_sql(raw_sql)

    def generate_answer(self, question: str, sql: str, rows: list[dict]) -> str:
        """
        Generates a concise, natural English answer based on the query results.
        """
        if not rows:
            return "The query executed successfully, but returned 0 matching records from the database."

        # For small results, provide an intelligent summary
        sample_rows = rows[:5]
        total_count = len(rows)

        # Single aggregation scalar result
        if len(rows) == 1 and len(rows[0]) == 1:
            col_name, val = next(iter(rows[0].items()))
            formatted_val = f"{val:,.2f}" if isinstance(val, (int, float)) else str(val)
            clean_col = col_name.replace("_", " ").title()
            return f"The {clean_col} is {formatted_val}."

        prompt = f"""You are a helpful business intelligence assistant.
Summarize the database results in 1-2 clear, conversational sentences answering the user's original question.

User Question: {question}
SQL Query: {sql}
Total Rows: {total_count}
Sample Results (JSON):
{json.dumps(sample_rows, default=str)}

Respond with a direct, professional natural language summary. Do not repeat the raw SQL.
"""
        try:
            answer = self.llm.generate(prompt).strip()
            # If LLM returned empty or too verbose, fallback
            if answer and len(answer) < 300:
                return answer
        except Exception:
            pass

        return f"Query returned {total_count} matching record{'s' if total_count != 1 else ''} from the database."