import ast


def extract_functions(file_path):
    """Extract detailed information about functions from a Python file."""

    with open(file_path, "r") as file:
        source_code = file.read()

    tree = ast.parse(source_code)

    functions = []

    for node in ast.walk(tree):

        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):

            parameters = []

            for arg in node.args.args:
                parameters.append(arg.arg)

            source_lines = source_code.splitlines()

            start_line = node.lineno
            end_line = node.end_lineno

            function_source = "\n".join(
                source_lines[start_line - 1:end_line]
            )

            function_info = {
                "name": node.name,
                "parameters": parameters,
                "line_number": start_line,
                "docstring": ast.get_docstring(node),
                "source_code": function_source
            }

            functions.append(function_info)

    return functions


if __name__ == "__main__":

    functions = extract_functions("src/calculator.py")

    for function in functions:

        print("=" * 50)
        print("Function:", function["name"])
        print("Parameters:", function["parameters"])
        print("Line:", function["line_number"])
        print("Docstring:", function["docstring"])
        print("Source:")
        print(function["source_code"])
