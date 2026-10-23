#!/usr/bin/env python3
"""Consolida o código do repositório em um único .txt para auditoria de segurança."""
import os
import sys
from pathlib import Path

IGNORED_DIRS = {".git", ".venv", "node_modules", "docs", "screenshots", "__pycache__", ".vite"}
ALLOWED_EXTS = {".py", ".ts", ".tsx", ".json", ".md", ".toml", ".yml", ".yaml"}
OUTPUT_NAME = "codigo_consolidado.txt"


def should_include(name: str) -> bool:
    lower = name.lower()
    if lower.endswith("-lock.json"):
        return False
    return os.path.splitext(lower)[1] in ALLOWED_EXTS


def main() -> int:
    root = Path.cwd()
    output = root / (sys.argv[1] if len(sys.argv) > 1 else OUTPUT_NAME)
    count = 0

    with open(output, "w", encoding="utf-8", newline="\n") as out:
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = sorted(d for d in dirnames if d not in IGNORED_DIRS)
            for filename in sorted(filenames):
                path = Path(dirpath) / filename
                if path.resolve() == output.resolve() or path.name == Path(__file__).name:
                    continue
                if not should_include(filename):
                    continue
                rel = path.relative_to(root).as_posix()
                try:
                    content = path.read_text(encoding="utf-8", errors="replace")
                except OSError as exc:
                    print(f"[AVISO] Não foi possível ler {rel}: {exc}", file=sys.stderr)
                    continue
                out.write(f"=== ARQUIVO: {rel} ===\n{content}\n\n=== FIM DO ARQUIVO: {rel} ===\n\n")
                count += 1

    print(f"{count} arquivos consolidados em: {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
