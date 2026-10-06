from dataclasses import dataclass, field


@dataclass
class ASTNode:
    node_type: str
    name: str | None = None
    text: str | None = None
    start_line: int = 0
    end_line: int = 0
    children: list["ASTNode"] = field(default_factory=list)


@dataclass
class FileAST:
    path: str
    language: str
    root: ASTNode
    parse_error: bool = False