import re
from app.llm.base import BaseLLM


class MockLLM(BaseLLM):
    """
    Offline/Rule-based LLM adapter for testing and zero-configuration local runs.
    Translates common natural language queries into accurate SQL without external API calls.
    """

    def generate(self, prompt: str) -> str:
        # Check if this prompt is asking for natural language answer generation
        if "Summarize the database results" in prompt or "business intelligence assistant" in prompt:
            return "Based on the database records, the requested query executed successfully and returned the corresponding results."

        # Extract the user question from the prompt if present
        question = prompt
        if "User question:" in prompt:
            question = prompt.split("User question:")[1].strip()
            # If there's following instructions, split on double newline
            question = question.split("\n")[0].strip()
        elif "User Question:" in prompt:
            question = prompt.split("User Question:")[1].strip()
            question = question.split("\n")[0].strip()

        q = question.lower().strip()

        # Rule-based Text-to-SQL mapping
        if "highest" in q and ("paid" in q or "salary" in q):
            limit_match = re.search(r"\b(\d+)\b", q)
            limit = limit_match.group(1) if limit_match else "5"
            return f"SELECT employee_id, first_name, last_name, department, designation, salary FROM employees ORDER BY salary DESC LIMIT {limit};"

        if "lowest" in q and ("paid" in q or "salary" in q):
            limit_match = re.search(r"\b(\d+)\b", q)
            limit = limit_match.group(1) if limit_match else "5"
            return f"SELECT employee_id, first_name, last_name, department, designation, salary FROM employees ORDER BY salary ASC LIMIT {limit};"

        if "average salary" in q or "avg salary" in q:
            if "department" in q:
                return "SELECT department, COUNT(*) AS employee_count, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY department ORDER BY avg_salary DESC;"
            if "location" in q or "city" in q:
                return "SELECT city, COUNT(*) AS employee_count, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY city ORDER BY avg_salary DESC;"
            return "SELECT ROUND(AVG(salary), 2) AS average_salary FROM employees;"

        if "total salary" in q or "salary expense" in q or "sum of salary" in q:
            if "department" in q:
                return "SELECT department, ROUND(SUM(salary), 2) AS total_payroll FROM employees GROUP BY department ORDER BY total_payroll DESC;"
            return "SELECT ROUND(SUM(salary), 2) AS total_payroll FROM employees;"

        if "work location" in q or "remote" in q or "on-site" in q or "hybrid" in q:
            return "SELECT work_location, COUNT(*) AS employee_count FROM employees GROUP BY work_location ORDER BY employee_count DESC;"

        if "department" in q and ("count" in q or "how many" in q or "distribution" in q):
            return "SELECT department, COUNT(*) AS employee_count FROM employees GROUP BY department ORDER BY employee_count DESC;"

        if "performance" in q or "performer" in q or "rating" in q:
            return "SELECT employee_id, first_name, last_name, department, performance_score FROM employees ORDER BY performance_score DESC LIMIT 5;"

        if "experience" in q and ("top" in q or "most" in q or "highest" in q):
            return "SELECT employee_id, first_name, last_name, department, experience FROM employees ORDER BY experience DESC LIMIT 5;"

        if "gender" in q or "diversity" in q:
            return "SELECT gender, COUNT(*) AS count FROM employees GROUP BY gender;"

        if "how many employees" in q or "total employees" in q or "employee count" in q:
            return "SELECT COUNT(*) AS total_employees FROM employees;"

        if "list departments" in q or "all departments" in q:
            return "SELECT DISTINCT department FROM employees ORDER BY department ASC;"

        # Check for specific department filter
        departments = ["engineering", "sales", "marketing", "hr", "finance", "operations", "legal"]
        for dept in departments:
            if dept in q:
                return f"SELECT employee_id, first_name, last_name, designation, salary FROM employees WHERE LOWER(department) LIKE '%{dept}%' LIMIT 10;"

        # Check for general employee listing intents
        valid_query_keywords = ["show", "list", "get", "find", "all", "employee", "record", "table", "data", "who", "what", "where", "which"]
        if any(kw in q for kw in valid_query_keywords):
            return "SELECT employee_id, first_name, last_name, department, designation, salary FROM employees LIMIT 10;"

        # Unrecognized / Invalid input fallback
        return "INVALID"
