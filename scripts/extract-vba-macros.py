import json
import re
import sys
from pathlib import Path

from oletools.olevba import VBA_Parser


PROCEDURE_RE = re.compile(
    r"^\s*(?:Public\s+|Private\s+|Friend\s+|Static\s+)?(Sub|Function)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(",
    re.IGNORECASE | re.MULTILINE,
)


def summarize_code(code: str) -> dict:
    procedures = [
        {"type": match.group(1), "name": match.group(2)}
        for match in PROCEDURE_RE.finditer(code or "")
    ]
    interesting_lines = []

    for line in (code or "").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("'"):
            continue
        if re.search(r"\b(Range|Cells|Sheets|Worksheets|Calculate|GoalSeek|Solver|PrintOut|ExportAsFixedFormat|Protect|Unprotect)\b", stripped, re.I):
            interesting_lines.append(stripped)
        if len(interesting_lines) >= 40:
            break

    return {
        "lineCount": len((code or "").splitlines()),
        "procedures": procedures,
        "interestingLines": interesting_lines,
    }


def extract(path: Path) -> dict:
    parser = VBA_Parser(str(path))
    modules = []

    if not parser.detect_vba_macros():
        parser.close()
        return {"path": str(path), "hasMacros": False, "modules": []}

    try:
        for _filename, stream_path, vba_filename, code in parser.extract_macros():
            summary = summarize_code(code or "")
            modules.append(
                {
                    "streamPath": stream_path,
                    "moduleName": vba_filename,
                    **summary,
                }
            )
    finally:
        parser.close()

    return {
        "path": str(path),
        "hasMacros": True,
        "moduleCount": len(modules),
        "procedureCount": sum(len(module["procedures"]) for module in modules),
        "modules": modules,
    }


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: extract-vba-macros.py <workbook> [<workbook> ...]")

    results = [extract(Path(arg)) for arg in sys.argv[1:]]
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
