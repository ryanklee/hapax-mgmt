#!/usr/bin/env python
"""Scan vault markdown files and validate frontmatter against Pydantic schemas.

Usage:
    uv run python scripts/vault_validate.py
    uv run python scripts/vault_validate.py --data-dir ./demo-data
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from pydantic import ValidationError

from shared.frontmatter import parse_frontmatter
from shared.vault_schemas import resolve_schema


def validate_dir(data_dir: Path) -> list[tuple[Path, str]]:
    """Validate all .md files in *data_dir*. Returns list of (path, error_msg)."""
    errors: list[tuple[Path, str]] = []

    for md_path in sorted(data_dir.rglob("*.md")):
        fm, _ = parse_frontmatter(md_path)
        if not fm:
            continue  # no frontmatter — skip

        doc_type = fm.get("type")
        if not doc_type:
            continue  # no type field — nothing to validate

        schema = resolve_schema(doc_type)
        if schema is None:
            continue  # unknown type — no schema registered

        try:
            schema.model_validate(fm)
        except ValidationError as exc:
            errors.append((md_path, str(exc)))

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate vault frontmatter against schemas")
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path("data"),
        help="Root data directory to scan (default: ./data)",
    )
    args = parser.parse_args()

    data_dir: Path = args.data_dir.resolve()
    if not data_dir.is_dir():
        print(f"Data directory not found: {data_dir}", file=sys.stderr)
        return 1

    errors = validate_dir(data_dir)

    if not errors:
        print(f"All documents in {data_dir} pass schema validation.")
        return 0

    print(f"{len(errors)} validation error(s):\n")
    for path, msg in errors:
        print(f"--- {path} ---")
        print(msg)
        print()

    return 1


if __name__ == "__main__":
    sys.exit(main())
