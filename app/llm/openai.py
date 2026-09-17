import os
from dotenv import load_dotenv
from openai import OpenAI

from app.llm.base import BaseLLM

load_dotenv()


class OpenAILLM(BaseLLM):

    def __init__(self, client: OpenAI | None = None, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if client is not None:
            self.client = client
        else:
            if not self.api_key:
                raise ValueError(
                    "OPENAI_API_KEY is not set. Please provide it or set it in .env"
                )
            self.client = OpenAI(api_key=self.api_key)

        self.model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    def generate(self, prompt: str) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional SQLite database assistant. Output only the requested response without unnecessary conversational filler.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.0,
            )
            choice = response.choices[0]
            return choice.message.content or ""
        except Exception as e:
            raise RuntimeError(f"OpenAI API error ({self.model}): {e}") from e