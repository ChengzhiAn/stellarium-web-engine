#!/usr/bin/env python3
"""Merge tools/generated-hip-proper-names.json into western skyculture index.json.

Preserves existing HIP entries; adds missing keys. Applies display-name fixes.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT / "tools" / "generated-hip-proper-names.json"
PRIMARY = ROOT / "apps" / "skydata" / "skycultures" / "western" / "index.json"
MIRRORS = [
    ROOT / "apps" / "test-skydata" / "skycultures" / "western" / "index.json",
    ROOT / "apps" / "CuxBP1yx" / "skycultures" / "western" / "index.json",
]


def normalize_english(hip: int, name: str) -> str:
    n = name.strip()
    if hip == 100751:
        return "Alpha Pavonis"
    if hip == 71683 and n.replace(" ", "") == "RigelKentaurus":
        return "Rigil Kentaurus"
    if n.isupper() and " " not in n:
        return n.title()
    return n


def main() -> None:
    items = json.loads(GENERATED.read_text(encoding="utf-8"))
    from_gen: dict[str, list[dict[str, str]]] = {}
    for row in items:
        hip = int(row["hip"])
        eng = normalize_english(hip, str(row["english"]))
        from_gen[f"HIP {hip}"] = [{"english": eng}]

    if not PRIMARY.is_file():
        raise SystemExit(f"missing primary western index: {PRIMARY}")
    doc = json.loads(PRIMARY.read_text(encoding="utf-8"))
    cn = doc.setdefault("common_names", {})
    assert isinstance(cn, dict)
    before = len(cn)
    for k, v in from_gen.items():
        if k not in cn:
            cn[k] = v
    PRIMARY.write_text(
        json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(PRIMARY, "keys", before, "->", len(cn))

    for path in MIRRORS:
        if not path.is_file():
            print("skip missing", path)
            continue
        mdoc = json.loads(path.read_text(encoding="utf-8"))
        mdoc["common_names"] = json.loads(json.dumps(cn))
        path.write_text(
            json.dumps(mdoc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print("mirror", path, "common_names keys", len(mdoc["common_names"]))


if __name__ == "__main__":
    main()
