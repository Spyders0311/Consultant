#!/usr/bin/env python3
"""Verify sheet_field_manifest.json matches live Pydantic worksheet models."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from tools.generate_sheet_field_manifest import WORKSHEET_MODEL_MAP, build_manifest, field_names  # noqa: E402
from app import models  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Check sheet field manifest drift.")
    parser.add_argument(
        "--manifest",
        default=str(Path(__file__).resolve().parents[2] / "knowledge" / "workbooks" / "sheet_field_manifest.json"),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    manifest_path = Path(args.manifest)
    if not manifest_path.exists():
        print(f"Manifest missing: {manifest_path}. Run generate_sheet_field_manifest.py first.")
        raise SystemExit(1)

    committed = json.loads(manifest_path.read_text(encoding="utf-8"))
    live = build_manifest()

    errors: list[str] = []
    for sheet_key, (input_name, output_name) in WORKSHEET_MODEL_MAP.items():
        committed_sheet = committed.get("worksheets", {}).get(sheet_key, {})
        live_sheet = live["worksheets"].get(sheet_key, {})

        if committed_sheet.get("inputs") != live_sheet.get("inputs"):
            errors.append(f"{sheet_key}: input fields drifted")

        if output_name:
            if committed_sheet.get("outputs") != live_sheet.get("outputs"):
                errors.append(f"{sheet_key}: output fields drifted")

    if errors:
        print("Sheet field manifest drift detected:")
        for error in errors:
            print(f"  - {error}")
        print("Run: python python_engine/tools/generate_sheet_field_manifest.py")
        raise SystemExit(1)

    catalog_path = Path(__file__).resolve().parents[2] / "knowledge" / "workbooks" / "worksheet_catalog.json"
    if catalog_path.exists():
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        catalog_keys = {entry["key"] for entry in catalog}
        manifest_keys = set(committed.get("worksheets", {}).keys())
        orphan_manifest = manifest_keys - catalog_keys - {"financial-ratios", "five-year-projections", "twelve-month-pl-comparisons", "twelve-month-analysis"}
        if orphan_manifest:
            print(f"Warning: manifest worksheets not in catalog: {', '.join(sorted(orphan_manifest))}")

    print(f"Sheet field manifest OK ({len(WORKSHEET_MODEL_MAP)} worksheets).")


if __name__ == "__main__":
    main()
