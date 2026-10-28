import time
import httpx

from app.core.config import settings
from app.services.model_config_service import model_config_service


class OllamaClient:
    """Server-side client for local inference with dynamic hyperparameter support."""

    def generate(
        self,
        system: str | None = None,
        prompt: str = "",
        model: str | None = None,
        temperature: float | None = None,
        top_p: float | None = None,
        max_tokens: int | None = None,
    ) -> str:
        # Load active configuration if not explicitly overridden
        active_params = model_config_service.get_hyperparameters()
        effective_system = system or active_params.get("system_prompt")
        effective_model = model or model_config_service.get_active_model() or settings.OLLAMA_MODEL
        effective_temp = temperature if temperature is not None else active_params.get("temperature", 0.20)
        effective_top_p = top_p if top_p is not None else active_params.get("top_p", 0.85)
        effective_max_tokens = max_tokens if max_tokens is not None else active_params.get("max_output_tokens", 4096)

        start_time = time.time()
        response = httpx.post(
            f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate",
            json={
                "model": effective_model,
                "system": effective_system,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": effective_temp,
                    "top_p": effective_top_p,
                    "num_predict": effective_max_tokens,
                },
            },
            timeout=settings.OLLAMA_GENERATION_TIMEOUT_SECONDS,
        )
        duration = time.time() - start_time
        response.raise_for_status()
        data = response.json()
        content = data.get("response")
        if not isinstance(content, str) or not content.strip():
            raise RuntimeError("Ollama returned an empty documentation response.")

        eval_count = data.get("eval_count", len(content.split()))
        model_config_service.record_inference_telemetry(tokens_generated=eval_count, duration_seconds=duration)

        return content.strip()

