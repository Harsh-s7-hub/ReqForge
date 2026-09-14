import os
import requests

from scripts.ast_process import parse_python_code, find_functions
from scripts.function_extractor import extract_functions
from scripts.prompt_builder import build_documentation_prompt
from scripts.multimodal_processor import process_image


def test_ast_processor():
    source_code = """
def hello(name):
    return f"Hello {name}"
"""

    tree = parse_python_code(source_code)
    functions = find_functions(tree)

    assert len(functions) == 1
    assert functions[0].name == "hello"


def test_function_extractor():
    functions = extract_functions("src/calculator.py")

    assert len(functions) >= 3
    assert functions[0]["name"] == "calculate_discount"


def test_prompt_builder():
    function_source = """
def add(a, b):
    return a + b
"""

    context = "The function adds two numbers."

    prompt = build_documentation_prompt(
        function_source,
        context
    )

    assert "def add(a, b)" in prompt
    assert "The function adds two numbers." in prompt
    assert "Parameters" in prompt
    assert "Return value" in prompt


def test_multimodal_processor():
    image_path = "knowledge_base/images/test.png"

    assert os.path.exists(image_path)

    result = process_image(image_path)

    assert result["file_name"] == "test.png"
    assert result["file_type"] == ".png"
def test_ollama_connection():
    response = requests.get("http://localhost:11434/api/tags")

    assert response.status_code == 200

    data = response.json()

    assert "models" in data
