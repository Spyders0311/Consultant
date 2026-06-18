#!/usr/bin/env python3
"""Generate sheet_field_manifest.json from Pydantic worksheet models."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app import models  # noqa: E402


WORKSHEET_MODEL_MAP = {
    "breakeven-analysis": ("BreakevenInput", "BreakevenResult"),
    "working-capital-analysis": ("WorkingCapitalInput", "WorkingCapitalResult"),
    "current-financial-information": ("CurrentFinancialInformationInput", "CurrentFinancialInformationResult"),
    "five-year-projections": ("FiveYearProjectionsInput", "FiveYearProjectionsResult"),
    "basic-client-info": ("BasicClientInfoInput", "BasicClientInfoResult"),
    "p-l-comparisons": ("PLComparisonsInput", None),
    "balance-sht-comparisons": ("BalanceSheetComparisonsInput", None),
    "misc-direct-expenses": ("MiscExpenseInput", None),
    "misc-indirect-expenses": ("MiscExpenseInput", None),
    "twelve-month-pl-comparisons": ("TwelveMonthPLInput", None),
    "twelve-month-analysis": ("MonthlyAnalysisInput", None),
    "financial-ratios": ("FinancialRatiosInput", None),
}


def field_names(model_cls) -> list[str]:
    names: list[str] = []
    for name, field in model_cls.model_fields.items():
        alias = field.alias or name
        names.append(alias)
    return sorted(names)


def build_manifest() -> dict:
    worksheets: dict[str, dict] = {}
    for sheet_key, (input_name, output_name) in WORKSHEET_MODEL_MAP.items():
        input_cls = getattr(models, input_name)
        entry: dict = {"inputs": field_names(input_cls)}
        if output_name:
            output_cls = getattr(models, output_name)
            entry["outputs"] = field_names(output_cls)
        worksheets[sheet_key] = entry
    return {"version": 1, "worksheets": worksheets}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate sheet field manifest from Pydantic models.")
    parser.add_argument(
        "--output",
        default=str(Path(__file__).resolve().parents[2] / "knowledge" / "workbooks" / "sheet_field_manifest.json"),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(build_manifest(), indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
