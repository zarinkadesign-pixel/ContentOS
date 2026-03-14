"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
astana_v3/deploy/encode_sa.py

USAGE:
    python deploy/encode_sa.py secrets/service_account.json

Encodes a Google Service Account JSON file to Base64.
Paste the output string into Railway as the GOOGLE_SA_B64 variable.
The bot decodes it back to a file on every startup.
"""

from __future__ import annotations

import base64
import json
import sys
from pathlib import Path


def encode_service_account(path: str) -> str:
    """Reads a JSON file, validates it, and returns its Base64-encoded contents."""
    data = Path(path).read_text(encoding="utf-8")
    json.loads(data)  # Validate JSON before encoding
    return base64.b64encode(data.encode()).decode()


def decode_and_save(
    b64_str: str,
    output_path: str = "secrets/service_account.json",
) -> None:
    """Decodes a Base64 string and writes it as a JSON file."""
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    data = base64.b64decode(b64_str).decode()
    json.loads(data)  # Validate before writing
    out.write_text(data, encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python deploy/encode_sa.py <path/to/service_account.json>")
        sys.exit(1)

    encoded = encode_service_account(sys.argv[1])

    separator = "=" * 60
    print(f"\n{separator}")
    print("Copy this string into Railway → Variables → GOOGLE_SA_B64:")
    print(separator)
    print(encoded)
    print(f"{separator}\n")
    print(f"String length: {len(encoded)} characters")
