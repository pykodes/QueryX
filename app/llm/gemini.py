from app.llm.base import BaseLLM


class GeminiLLM(BaseLLM):

    def __init__(self, client):
        self.client = client

    def generate(self, prompt: str) -> str:
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return response.text