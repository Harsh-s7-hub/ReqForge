import requests
import time

from prompt_builder import build_documentation_prompt


def generate_documentation(function_source, context="", model="qwen3:0.6b", image_context=None):
    """
    Generate documentation for a Python function using Ollama.
    """

    prompt = build_documentation_prompt(
        function_source=function_source,
        context=context,
        image_context=image_context
    )

    start_time = time.time()

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": model,
            "prompt": prompt,
            "stream": False
        }
    )

    response.raise_for_status()

    result = response.json()

    latency = time.time() - start_time

    return {
        "documentation": result["response"],
        "latency": round(latency, 2),
        "model": model
    }


if __name__ == "__main__":

    function_source = """
def calculate_discount(price, percentage):
    return price * (1 - percentage / 100)
"""

    context = "The function calculates a discount from an original price."

    result = generate_documentation(
        function_source=function_source,
        context=context
    )

    print("Documentation:")
    print(result["documentation"])

    print("\nLatency:", result["latency"], "seconds")
    print("Model:", result["model"])
