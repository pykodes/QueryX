import os
from dotenv import load_dotenv
import google.generativeai as genai

from app.llm.base import BaseLLM

load_dotenv()


class GeminiLLM(BaseLLM):

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY is not set. Please provide it or set it in .env"
            )
        # Configure the generative AI client
        genai.configure(api_key=self.api_key)
        self.model_name = model or os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        self.model = genai.GenerativeModel(self.model_name)

    def generate(self, prompt: str) -> str:
        try:
            response = self.model.generate_content(prompt)
            return response.text or ""
        except Exception as e:
            raise RuntimeError(f"Gemini API error ({self.model_name}): {e}") from e