import os

from dotenv import load_dotenv
from groq import Groq

from app.llm.base import BaseLLM

load_dotenv()


class GroqLLM(BaseLLM):

    def __init__(
        self,
        client: Groq | None = None,
        api_key: str | None = None,
        model: str | None = None,
    ):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")

        if client is not None:
            self.client = client
        else:
            if not self.api_key:
                raise ValueError(
                    "GROQ_API_KEY is not set. Please provide it or set it in .env"
                )

            self.client = Groq(api_key=self.api_key)

        self.model = model or os.getenv(
            "GROQ_MODEL",
            "openai/gpt-oss-20b",
        )

    def generate(self, prompt: str) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert SQLite database assistant. "
                            "Follow the user's instructions exactly."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                temperature=0.0,
            )

            choice = response.choices[0]
            return choice.message.content or ""

        except Exception as e:
            raise RuntimeError(
                f"Groq API error ({self.model}): {e}"
            ) from e