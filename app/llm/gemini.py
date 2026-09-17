import os
from dotenv import load_dotenv
from google import genai

from app.llm.base import BaseLLM


load_dotenv()


class GeminiLLM(BaseLLM):

    def __init__(self):
        self.client = genai.Client(
            api_key=os.getenv("GEMINI_API_KEY")
        )

    def generate(self, prompt: str) -> str:
        response = self.client.models.generate_content(
            model="gemini-3.6-flash",
            input=prompt
        )

        return response.text