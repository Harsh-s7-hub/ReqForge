import ast


def parse_python_code(source_code):
    """Parse Python source code into an Abstract Syntax Tree."""
    return ast.parse(source_code)


def find_functions(tree):
    """Find all function definitions in the AST."""
    functions = []

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            functions.append(node)

    return functions


if __name__ == "__main__":
    with open("src/calculator.py", "r") as file:
        source_code = file.read()

    tree = parse_python_code(source_code)
    functions = find_functions(tree)

    print("Functions found:")

    for function in functions:
        print(f"- {function.name}")
