from app.llm.base import BaseLLM
from app.services.schema_service import SchemaService


class QueryService:

    def __init__(self, llm: BaseLLM, schema_service: SchemaService):
        self.llm = llm
        self.schema_service = schema_service

    def generate_sql(self, question: str) -> str:
        schema = self.schema_service.get_schema()

        prompt = f"""
You are a SQL assistant.

Convert the user's natural language question into a SQLite SQL query.

Database schema:
{schema}

User question:
{question}

Return only the SQL query.
Do not include markdown code fences.
"""

        return self.llm.generate(prompt)