def validate_sql(sql: str):
    if not sql or not sql.strip():
        return False, "SQL query cannot be empty"

    query = sql.strip().lower()

    if not query.startswith("select"):
        return False, "Only SELECT queries are allowed"

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
        "detach"
    ]

    for keyword in dangerous_keywords:
        if keyword in query:
            return False, f"Forbidden SQL keyword: {keyword}"

    if ";" in query[:-1]:
        return False, "Multiple SQL statements are not allowed"

    return True, "SQL query is valid"