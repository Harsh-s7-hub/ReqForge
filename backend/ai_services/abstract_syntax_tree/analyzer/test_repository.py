from ai_services.abstract_syntax_tree.analyzer.repository_analyzer import (
    analyze_repository,
)


REPOSITORY_PATH = "ai_services/abstract_syntax_tree"


result = analyze_repository(REPOSITORY_PATH)

print("\n========== REPOSITORY ANALYSIS ==========")

print("Repository:", result["repository"])
print("Files scanned:", result["files_scanned"])
print("Files parsed:", result["files_parsed"])
print("Unsupported files:", result["unsupported_files"])
print("Parse errors:", result["parse_errors"])

print("\nLanguages:")

for language, count in result["languages"].items():
    print(f"  {language}: {count}")