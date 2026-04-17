from __future__ import annotations

import hashlib
import os
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import dataclass


@dataclass(frozen=True)
class WorkbookContext:
    path: str
    sha256: str
    size_bytes: int
    sheet_names: list[str]

    @property
    def sheet_count(self) -> int:
        return len(self.sheet_names)


def _compute_sha256(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _load_sheet_names(path: str) -> list[str]:
    with zipfile.ZipFile(path, "r") as workbook_zip:
        workbook_xml = workbook_zip.read("xl/workbook.xml")
    root = ET.fromstring(workbook_xml)
    ns = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    return [node.attrib.get("name", "") for node in root.findall("main:sheets/main:sheet", ns)]


def load_workbook_context(path: str) -> WorkbookContext:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Spreadsheet not found at {path}")

    sha256 = _compute_sha256(path)
    size_bytes = os.path.getsize(path)
    sheet_names = _load_sheet_names(path)

    return WorkbookContext(
        path=path,
        sha256=sha256,
        size_bytes=size_bytes,
        sheet_names=sheet_names,
    )
