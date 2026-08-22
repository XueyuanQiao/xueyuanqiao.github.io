#!/usr/bin/env python3
"""Validate short-link definitions and, optionally, their built output."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


SLUG_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]*$")


def read_redirect_target(path: Path) -> str | None:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        return None

    front_matter = text.split("---", 2)[1]
    for line in front_matter.splitlines():
        if line.startswith("redirect_to:"):
            return line.split(":", 1)[1].strip().strip('"\'')
    return None


def output_path(site_dir: Path, route: str) -> Path:
    route_path = route.lstrip("/")
    if route.endswith("/"):
        return site_dir / route_path / "index.html"
    return site_dir / route_path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default="_shortlinks", type=Path)
    parser.add_argument("--site", type=Path, help="Built Jekyll destination to verify")
    args = parser.parse_args()

    errors: list[str] = []
    definitions = sorted(args.source.glob("*.md"))

    if not definitions:
        errors.append(f"No short-link definitions found in {args.source}")

    for definition in definitions:
        slug = definition.stem
        target = read_redirect_target(definition)

        if not SLUG_PATTERN.fullmatch(slug):
            errors.append(f"{definition}: slug must match {SLUG_PATTERN.pattern}")
        if not target:
            errors.append(f"{definition}: missing redirect_to")
            continue
        if not target.startswith("/") or target.startswith("//"):
            errors.append(f"{definition}: redirect_to must be a same-site absolute path")
        if any(char in target for char in ("?", "#", "\n", "\r")):
            errors.append(f"{definition}: put query strings and fragments on the short URL, not redirect_to")

        if args.site:
            short_page = args.site / "go" / slug / "index.html"
            target_page = output_path(args.site, target)
            if not short_page.is_file():
                errors.append(f"{definition}: built short page is missing: {short_page}")
            if not target_page.is_file():
                errors.append(f"{definition}: built target is missing: {target_page}")

    if errors:
        print("Short-link validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Validated {len(definitions)} short link(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
