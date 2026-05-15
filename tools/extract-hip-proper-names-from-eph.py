#!/usr/bin/env python3
"""Scan Stellarium Web Engine star .eph tiles and list (HIP, proper_name_candidate).

Proper names are inferred from the pipe-separated `ids` field: first token that
is not a catalog id (HIP/HD/Gaia/TYC/BD/CP/CD) and not a Bayer (* / V*) label.
Output: JSON lines {"hip": N, "english": "Name"} for merging into western
skyculture common_names (and a companion list for Chinese translation).
"""
from __future__ import annotations

import glob
import json
import os
import re
import struct
import zlib

STARS_DIR = os.path.join(
    os.path.dirname(__file__), "..", "apps", "skydata", "stars"
)


def _parse_star_chunk(body: bytes) -> list[tuple[int, str]]:
    """Return list of (hip, english_proper_name) from one STAR chunk body."""
    if len(body) < 12:
        return []
    ver = struct.unpack_from("<i", body, 0)[0]
    if ver < 3:
        return []
    data_ofs = 12
    if data_ofs + 16 > len(body):
        return []
    flags = struct.unpack_from("<i", body, data_ofs + 0)[0]
    row_size = struct.unpack_from("<i", body, data_ofs + 4)[0]
    n_col = struct.unpack_from("<i", body, data_ofs + 8)[0]
    n_row = struct.unpack_from("<i", body, data_ofs + 12)[0]
    hdr_end = data_ofs + 16 + n_col * 20
    if hdr_end > len(body) or row_size <= 0 or n_row <= 0:
        return []

    # Row payload is zlib-compressed (see eph_read_compressed_block in eph-file.c).
    if hdr_end + 8 > len(body):
        return []
    uncomp_sz, comp_sz = struct.unpack_from("<ii", body, hdr_end)
    if uncomp_sz < 0 or comp_sz < 0 or hdr_end + 8 + comp_sz > len(body):
        return []
    if uncomp_sz != n_row * row_size:
        return []
    try:
        raw = zlib.decompress(body[hdr_end + 8 : hdr_end + 8 + comp_sz])
    except zlib.error:
        return []
    if len(raw) != uncomp_sz:
        return []

    col_meta: dict[str, tuple[int, int]] = {}
    for i in range(n_col):
        base = data_ofs + 16 + i * 20
        name = body[base : base + 4].decode("ascii", "replace").rstrip("\x00")
        cstart = struct.unpack_from("<i", body, base + 12)[0]
        csize = struct.unpack_from("<i", body, base + 16)[0]
        col_meta[name] = (cstart, csize)

    if "ids" not in col_meta or "hip" not in col_meta:
        return []

    ids_off, ids_sz = col_meta["ids"]
    hip_off, _hip_sz = col_meta["hip"]

    if flags & 1:
        # Column-major shuffle -> row-major
        buf = bytearray(n_row * row_size)
        for j in range(row_size):
            for i in range(n_row):
                buf[i * row_size + j] = raw[j * n_row + i]
        raw = bytes(buf)

    cat_prefix = re.compile(
        r"^(HIP\s|HD\s|Gaia\s|GAIA\s|TYC|BD\s|CD\s|CP-|BD-|HD\d)",
        re.I,
    )

    def pick_proper(ids: str) -> str | None:
        for part in ids.split("|"):
            p = part.strip()
            if not p:
                continue
            if p.startswith("*") or p.startswith("V*"):
                continue
            if cat_prefix.match(p):
                continue
            if re.fullmatch(r"\d+", p):
                continue
            # Greek-letter style Bayer spelled without * prefix
            if re.match(r"^(Alpha|Beta|Gamma|Delta|Epsilon|Zeta|Eta|Theta|Iota|Kappa|Lambda|Mu|Nu|Xi|Omicron|Pi|Rho|Sigma|Tau|Upsilon|Phi|Chi|Psi|Omega)\s", p):
                continue
            if len(p) < 2:
                continue
            return p
        return None

    out: list[tuple[int, str]] = []
    for r in range(n_row):
        row = raw[r * row_size : (r + 1) * row_size]
        hip = struct.unpack_from("<i", row, hip_off)[0]
        if hip <= 0:
            continue
        ids_b = row[ids_off : ids_off + ids_sz].split(b"\x00", 1)[0]
        try:
            ids = ids_b.decode("utf-8")
        except UnicodeDecodeError:
            ids = ids_b.decode("latin-1", "replace")
        name = pick_proper(ids)
        if name:
            out.append((hip, name))
    return out


def iter_eph_files(root: str) -> list[str]:
    return sorted(glob.glob(os.path.join(root, "**", "*.eph"), recursive=True))


def parse_eph_file(path: str) -> list[tuple[int, str]]:
    data = open(path, "rb").read()
    if len(data) < 12 or data[:4] != b"EPHE":
        return []
    off = 8
    found: list[tuple[int, str]] = []
    while off + 8 <= len(data):
        typ = data[off : off + 4]
        ln = struct.unpack_from("<i", data, off + 4)[0]
        if ln < 0 or off + 8 + ln + 4 > len(data):
            break
        chunk = data[off + 8 : off + 8 + ln]
        if typ == b"STAR":
            found.extend(_parse_star_chunk(chunk))
        off += 8 + ln + 4
    return found


def main() -> None:
    root = os.path.normpath(STARS_DIR)
    hip_to_name: dict[int, str] = {}
    for path in iter_eph_files(root):
        for hip, name in parse_eph_file(path):
            prev = hip_to_name.get(hip)
            if prev is None or len(name) > len(prev):
                hip_to_name[hip] = name
    items = [{"hip": h, "english": n} for h, n in sorted(hip_to_name.items())]
    out_json = os.path.join(
        os.path.dirname(__file__), "generated-hip-proper-names.json"
    )
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=0)
    print("Wrote", out_json, "count", len(items))


if __name__ == "__main__":
    main()
