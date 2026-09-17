from app.llm.base import BaseLLM


class OpenAILLM(BaseLLM):

    def __init__(self, client):
        self.client = client

    def generate(self, prompt: str) -> str:
        response = self.client.responses.create(
            model="gpt-5-mini",
            input=prompt
        )

        return response.output_text