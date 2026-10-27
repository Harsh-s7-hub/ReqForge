import httpx

from app.core.config import settings


class OllamaClient:
    """Minimal server-side client for local, non-streaming generation."""

    def generate(self, system: str, prompt: str) -> str:
        response = httpx.post(
            f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate",
            json={
                "model": settings.OLLAMA_MODEL,
                "system": system,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.2},
            },
            timeout=settings.OLLAMA_GENERATION_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        content = response.json().get("response")
        if not isinstance(content, str) or not content.strip():
            raise RuntimeError("Ollama returned an empty documentation response.")
        return content.strip()
