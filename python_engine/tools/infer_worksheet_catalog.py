#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

PRIORITY_SHEETS = {
    "CURRENT FINANCIAL INFORMATION",
    "BASIC CLIENT INFO",
    "P&L COMPARISONS",
    "BALANCE SHT COMPARISONS",
    "WORKING CAPITAL ANALYSIS",
    "BREAKEVEN ANALYSIS",
    "5 YEAR PROJECTIONS",
}


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "sheet"


def infer_category(sheet_name: str) -> str:
    upper_name = sheet_name.upper()
    if "INVOICE" in upper_name or "BILL" in upper_name:
        return "invoice-billing"
    if "MARKETING" in upper_name:
        return "marketing"
    if (
        "CONSULT" in upper_name
        or "MANAGEMENT" in upper_name
        or "EMPLOYEE" in upper_name
        or "QUESTIONNAIRE" in upper_name
    ):
        return "consulting"
    if "FORM" in upper_name:
        return "bms-forms"
    return "analyst-wizard"


def infer_priority(sheet_name: str) -> int:
    return 100 if sheet_name.upper() in PRIORITY_SHEETS else 0


def build_catalog(sheet_names: list[str]) -> list[dict[str, str | int]]:
    key_counts: dict[str, int] = {}
    catalog: list[dict[str, str | int]] = []

    for sheet_name in sheet_names:
        base_key = slugify(sheet_name)
        occurrence = key_counts.get(base_key, 0)
        key_counts[base_key] = occurrence + 1
        key = base_key if occurrence == 0 else f"{base_key}-{occurrence + 1}"

        catalog.append(
            {
                "key": key,
                "sheetName": sheet_name,
                "category": infer_category(sheet_name),
                "priorityRank": infer_priority(sheet_name),
            }
        )

    return sorted(
        catalog,
        key=lambda row: (row["category"], -int(row["priorityRank"]), str(row["sheetName"]).lower()),
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Infer a worksheet catalog from analyst_program_manifest.json."
    )
    parser.add_argument("--input", required=True, help="Path to source manifest JSON file")
    parser.add_argument("--output", required=True, help="Path to write worksheet catalog JSON")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        raise FileNotFoundError(f"Manifest not found: {input_path}")

    manifest = json.loads(input_path.read_text(encoding="utf-8"))
    sheets = manifest.get("sheets")
    if not isinstance(sheets, list):
        raise ValueError("Manifest must include a 'sheets' array.")

    catalog = build_catalog([str(name) for name in sheets])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
