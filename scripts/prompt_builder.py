def build_documentation_prompt(function_source, context="", image_context=None):
    """
    Build a prompt for generating documentation for a Python function.
    """

    prompt = f"""
You are an AI code documentation assistant.

Your task is to generate clear and useful documentation for the
following Python function.

FUNCTION SOURCE:
{function_source}

RETRIEVED CONTEXT:
{context}
"""

    if image_context:
        prompt += f"""

IMAGE / DIAGRAM CONTEXT:
{image_context}
"""

    prompt += """

Generate documentation that includes:

1. Purpose of the function
2. Parameters
3. Return value
4. Brief explanation of how the function works

Do not modify or rewrite the original code.
Provide only the documentation.
"""

    return prompt


if __name__ == "__main__":

    function_source = """
def calculate_discount(price, percentage):
    return price * (1 - percentage / 100)
"""

    context = "A discount percentage is applied to the original price."

    prompt = build_documentation_prompt(
        function_source,
        context
    )

    print(prompt)
