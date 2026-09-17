import os
from dotenv import load_dotenv
from google import genai

from app.llm.base import BaseLLM

load_dotenv()


class GeminiLLM(BaseLLM):

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY is not set. Please provide it or set it in .env"
            )
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.client = genai.Client(api_key=self.api_key)

    def generate(self, prompt: str) -> str:
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
            )
            return response.text or ""
        except Exception as e:
            raise RuntimeError(f"Gemini API error ({self.model}): {e}") from e