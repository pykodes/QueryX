import re

from pydantic import BaseModel, ConfigDict


class SQLValidationResult(BaseModel):
    """
    Represents the result of SQL validation.
    """

    model_config = ConfigDict(
        extra="forbid"
    )

    is_valid: bool
    message: str


def validate_sql(sql: str) -> SQLValidationResult:
    """
    Validate an SQL query.

    Only single SELECT statements are allowed.
    Database connection or execution is not performed here.
    """

    # Check empty SQL
    if not sql or not sql.strip():
        return SQLValidationResult(
            is_valid=False,
            message="SQL query cannot be empty"
        )

    query = sql.strip()

    # Remove one final semicolon if present
    query_without_final_semicolon = (
        query[:-1].rstrip()
        if query.endswith(";")
        else query
    )

    # Only SELECT queries are allowed
    if not re.match(
        r"^select\b",
        query_without_final_semicolon,
        re.IGNORECASE
    ):
        return SQLValidationResult(
            is_valid=False,
            message="Only SELECT queries are allowed"
        )

    # Prevent multiple SQL statements
    if ";" in query_without_final_semicolon:
        return SQLValidationResult(
            is_valid=False,
            message="Multiple SQL statements are not allowed"
        )

    # Dangerous SQL operations
    dangerous_keywords = [
        "insert",
        "update",
        "delete",
        "drop",
        "alter",
        "truncate",
        "create",
        "replace",
        "attach",
        "detach",
        "pragma",
        "vacuum",
    ]

    for keyword in dangerous_keywords:
        pattern = rf"\b{keyword}\b"

        if re.search(
            pattern,
            query_without_final_semicolon,
            re.IGNORECASE
        ):
            return SQLValidationResult(
                is_valid=False,
                message=f"Forbidden SQL keyword: {keyword}"
            )

    return SQLValidationResult(
        is_valid=True,
        message="SQL query is valid"
    )
