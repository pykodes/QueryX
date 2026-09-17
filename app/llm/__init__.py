import os
import logging
from app.llm.base import BaseLLM
from app.llm.gemini import GeminiLLM
from app.llm.openai import OpenAILLM
from app.llm.mock import MockLLM
from app.llm.groq import GroqLLM

logger = logging.getLogger("queryx.llm")


def get_llm(provider: str | None = None) -> BaseLLM:
    """
    Factory to retrieve an LLM adapter instance.
    Determines provider from argument, environment variable LLM_PROVIDER,
    or falls back gracefully to MockLLM if API keys are missing.
    """
    selected_provider = (provider or os.getenv("LLM_PROVIDER", "gemini")).lower().strip()

    if selected_provider == "gemini":
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key and api_key != "your_gemini_api_key_here":
            try:
                return GeminiLLM()
            except Exception as e:
                logger.warning(f"Could not initialize GeminiLLM ({e}), falling back to MockLLM.")
                return MockLLM()
        else:
            logger.info("GEMINI_API_KEY not configured. Using MockLLM for local execution.")
            return MockLLM()

    elif selected_provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and api_key != "your_openai_api_key_here":
            try:
                return OpenAILLM()
            except Exception as e:
                logger.warning(f"Could not initialize OpenAILLM ({e}), falling back to MockLLM.")
                return MockLLM()
        else:
            logger.info("OPENAI_API_KEY not configured. Using MockLLM for local execution.")
            return MockLLM()
    elif selected_provider == "groq":
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            try:
                return GroqLLM()
            except Exception as e:
                logger.warning(
                    f"Could not initialize GroqLLM ({e}), falling back to MockLLM."
                )
                return MockLLM()
        else:
            logger.info(
                "GROQ_API_KEY not configured. Using MockLLM for local execution."
            )
            return MockLLM()

    elif selected_provider == "mock":
        return MockLLM()

    else:
        logger.warning(f"Unknown LLM provider '{selected_provider}', defaulting to MockLLM.")
        return MockLLM()


__all__ = ["BaseLLM", "GeminiLLM", "OpenAILLM", "GroqLLM", "MockLLM", "get_llm"]
