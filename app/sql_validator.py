import re


def validate_sql(sql: str) -> tuple[bool, str]:
    """
    Validate an SQL query.

    Only single SELECT statements are allowed.
    Database connection or execution is not performed here.
    """

    # Check empty SQL
    if not sql or not sql.strip():
        return False, "SQL query cannot be empty"

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
        return False, "Only SELECT queries are allowed"

    # Prevent multiple SQL statements
    if ";" in query_without_final_semicolon:
        return False, "Multiple SQL statements are not allowed"

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
            return False, f"Forbidden SQL keyword: {keyword}"

    return True, "SQL query is valid"
