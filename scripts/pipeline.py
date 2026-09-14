import os

from function_extractor import extract_functions
from llm_generator import generate_documentation
from multimodal_processor import process_image


def generate_file_documentation(
    file_path,
    context="",
    model="qwen3:0.6b",
    image_path=None
):
    """
    Generate documentation for all functions in a Python file.

    Optional image/diagram information can be processed and
    included as multimodal context.
    """

    functions = extract_functions(file_path)

    image_context = None

    if image_path:
        image_info = process_image(image_path)

        image_context = (
            f"Image file: {image_info['file_name']}. "
            f"File type: {image_info['file_type']}. "
            "The image can provide additional context for "
            "understanding the function."
        )

    results = []

    for function in functions:

        result = generate_documentation(
            function_source=function["source_code"],
            context=context,
            model=model,
            image_context=image_context
        )

        results.append({
            "file": file_path,
            "function": function["name"],
            "documentation": result["documentation"],
            "latency": result["latency"],
            "model": result["model"]
        })

    return results


def save_documentation(results, output_path):
    """
    Save generated documentation to a Markdown file.
    """

    with open(output_path, "w") as file:

        for result in results:

            file.write(
                "# Function: "
                + result["function"]
                + "\n\n"
            )

            file.write(
                "**Source file:** "
                + result["file"]
                + "\n\n"
            )

            file.write("## Documentation\n\n")

            file.write(
                result["documentation"]
                + "\n\n"
            )

            file.write(
                f"**Latency:** {result['latency']} seconds\n\n"
            )

            file.write(
                f"**Model:** {result['model']}\n\n"
            )

            file.write("---\n\n")


if __name__ == "__main__":

    input_file = "src/calculator.py"
    output_file = "generated_docs/calculator.md"

    context = (
        "The calculator module contains functions for "
        "calculating discounts, taxes, and totals."
    )

    image_path = "knowledge_base/images/test.png"

    results = generate_file_documentation(
        file_path=input_file,
        context=context,
        image_path=image_path
    )

    save_documentation(
        results=results,
        output_path=output_file
    )

    print("Documentation generated successfully.")
    print("Output:", output_file)

    for result in results:

        print(
            f"{result['function']}: "
            f"{result['latency']} seconds"
        )
