#!/usr/bin/env python3
"""Clean a small classroom CSV. Uses only the Python standard library."""
import argparse
import csv
import logging
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="CSV with name and city columns")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    if args.input.resolve() == args.output.resolve():
        parser.error("Choose an output path different from the input.")
    try:
        with args.input.open(newline="", encoding="utf-8") as source:
            reader = csv.DictReader(source)
            if not {"name", "city"}.issubset(reader.fieldnames or []):
                parser.error("Input needs name and city columns.")
            rows = []
            seen = set()
            for row in reader:
                record = ((row.get("name") or "").strip(),
                          (row.get("city") or "").strip())
                if record[0] and record not in seen:
                    rows.append(record)
                    seen.add(record)
        with args.output.open("w", newline="", encoding="utf-8") as target:
            writer = csv.writer(target)
            writer.writerow(["name", "city"])
            writer.writerows(rows)
        logging.info("Wrote %d cleaned rows to %s", len(rows), args.output)
    except (OSError, UnicodeError, csv.Error) as error:
        logging.error("%s", error)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
