#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS = {"main": MAIN_NS}


def compute_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as workbook_file:
        for chunk in iter(lambda: workbook_file.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_workbook_xml(workbook_xml: bytes) -> tuple[list[str], list[dict[str, str]]]:
    root = ET.fromstring(workbook_xml)

    sheets = [
        sheet.attrib.get("name", "")
        for sheet in root.findall("main:sheets/main:sheet", NS)
    ]

    defined_names: list[dict[str, str]] = []
    for node in root.findall("main:definedNames/main:definedName", NS):
        name = node.attrib.get("name", "")
        if name.startswith("_xlnm."):
            continue
        defined_names.append({"name": name, "ref": node.text or ""})

    return sheets, defined_names


def build_manifest(input_path: Path) -> dict:
    with zipfile.ZipFile(input_path, "r") as workbook_zip:
        workbook_xml = workbook_zip.read("xl/workbook.xml")

    sheets, defined_names = parse_workbook_xml(workbook_xml)

    return {
        "workbookSha256": compute_sha256(input_path),
        "sheetCount": len(sheets),
        "definedNameCount": len(defined_names),
        "sheets": sheets,
        "definedNames": defined_names,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Extract a machine-readable manifest from an Excel workbook by parsing "
            "xl/workbook.xml."
        )
    )
    parser.add_argument("--input", required=True, help="Path to source .xlsx/.xlsm file")
    parser.add_argument("--output", required=True, help="Path to write JSON manifest")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        raise FileNotFoundError(f"Workbook not found: {input_path}")

    manifest = build_manifest(input_path)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
