#!/usr/bin/env python3
"""
Maritime Logbook CLI

Features:
- add: add a new passage (departure, destination, depart/arrive datetimes, distance in nautical miles)
- list: show all log entries
- summary: show totals (distance, passages, total duration)

Storage: CSV file with well-defined headers created on first use.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import os
import sys
from dataclasses import dataclass, asdict
from typing import Iterable, List, Optional


DEFAULT_CSV_PATH = os.environ.get("LOGBOOK_CSV", os.path.join(os.getcwd(), "logbook.csv"))


CSV_HEADERS = [
    "id",
    "departure_port",
    "destination_port",
    "departure_datetime",
    "arrival_datetime",
    "distance_nm",
    "created_at",
    "updated_at",
]


@dataclass
class LogEntry:
    id: int
    departure_port: str
    destination_port: str
    departure_datetime: str  # ISO 8601
    arrival_datetime: str  # ISO 8601
    distance_nm: float
    created_at: str  # ISO 8601
    updated_at: str  # ISO 8601

    @staticmethod
    def create(
        entry_id: int,
        departure_port: str,
        destination_port: str,
        departure_dt: dt.datetime,
        arrival_dt: dt.datetime,
        distance_nm: float,
    ) -> "LogEntry":
        now = dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
        return LogEntry(
            id=entry_id,
            departure_port=departure_port,
            destination_port=destination_port,
            departure_datetime=_to_iso8601_utc_str(departure_dt),
            arrival_datetime=_to_iso8601_utc_str(arrival_dt),
            distance_nm=round(float(distance_nm), 3),
            created_at=now,
            updated_at=now,
        )


def _to_iso8601_utc_str(value: dt.datetime) -> str:
    if value.tzinfo is None:
        # Assume input is local time; convert to UTC by assuming it's already UTC to avoid ambiguity.
        # Users should pass timezone-aware datetimes where possible.
        value = value.replace(tzinfo=dt.timezone.utc)
    value_utc = value.astimezone(dt.timezone.utc)
    return value_utc.replace(microsecond=0).isoformat().replace("+00:00", "Z")


def ensure_csv_exists(csv_path: str) -> None:
    if not os.path.exists(csv_path):
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
            writer.writeheader()


def read_all_entries(csv_path: str) -> List[LogEntry]:
    ensure_csv_exists(csv_path)
    entries: List[LogEntry] = []
    with open(csv_path, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not row.get("id"):
                continue
            try:
                entries.append(
                    LogEntry(
                        id=int(row["id"]),
                        departure_port=row["departure_port"],
                        destination_port=row["destination_port"],
                        departure_datetime=row["departure_datetime"],
                        arrival_datetime=row["arrival_datetime"],
                        distance_nm=float(row["distance_nm"]),
                        created_at=row["created_at"],
                        updated_at=row["updated_at"],
                    )
                )
            except Exception:
                # Skip malformed rows
                continue
    return entries


def write_entry(csv_path: str, entry: LogEntry) -> None:
    ensure_csv_exists(csv_path)
    file_exists = os.path.exists(csv_path)
    with open(csv_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
        if not file_exists:
            writer.writeheader()
        writer.writerow(_convert_entry_to_row(entry))


def _convert_entry_to_row(entry: LogEntry) -> dict:
    row = asdict(entry)
    # Ensure string conversion for CSV compatibility
    row["id"] = str(row["id"])  # type: ignore[index]
    row["distance_nm"] = f"{row['distance_nm']:.3f}"
    return row


def parse_datetime(value: str) -> dt.datetime:
    """Parse ISO 8601 datetime. Accepts forms like 2025-08-14T09:30, 2025-08-14 09:30, with or without timezone.

    If naive (no timezone), treat as UTC to avoid assumptions.
    """
    value_norm = value.strip().replace(" ", "T")
    try:
        # Python 3.11+ supports fromisoformat with 'Z'
        if value_norm.endswith("Z"):
            value_norm = value_norm[:-1] + "+00:00"
        dt_obj = dt.datetime.fromisoformat(value_norm)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(f"Invalid datetime format: {value}") from exc

    if dt_obj.tzinfo is None:
        dt_obj = dt_obj.replace(tzinfo=dt.timezone.utc)
    return dt_obj


def command_add(args: argparse.Namespace) -> int:
    csv_path = args.csv
    entries = read_all_entries(csv_path)
    next_id = (max((e.id for e in entries), default=0) + 1)

    departure_dt = parse_datetime(args.depart)
    arrival_dt = parse_datetime(args.arrive)
    if arrival_dt <= departure_dt:
        print("Error: arrival must be after departure", file=sys.stderr)
        return 2

    try:
        distance = float(args.distance)
    except ValueError:
        print("Error: distance must be a number (nautical miles)", file=sys.stderr)
        return 2
    if distance <= 0:
        print("Error: distance must be positive", file=sys.stderr)
        return 2

    entry = LogEntry.create(
        entry_id=next_id,
        departure_port=args.departure,
        destination_port=args.destination,
        departure_dt=departure_dt,
        arrival_dt=arrival_dt,
        distance_nm=distance,
    )

    write_entry(csv_path, entry)
    print(f"Added passage {entry.id}: {entry.departure_port} -> {entry.destination_port} ({entry.distance_nm:.1f} nm)")
    return 0


def _format_table(rows: List[List[str]], headers: List[str]) -> str:
    widths = [len(h) for h in headers]
    for row in rows:
        for idx, col in enumerate(row):
            widths[idx] = max(widths[idx], len(col))
    def fmt_row(items: Iterable[str]) -> str:
        return "  ".join(f"{val:<{widths[i]}}" for i, val in enumerate(items))
    lines = [fmt_row(headers), fmt_row(["-" * w for w in widths])]
    for row in rows:
        lines.append(fmt_row(row))
    return "\n".join(lines)


def command_list(args: argparse.Namespace) -> int:
    entries = read_all_entries(args.csv)
    if not entries:
        print("No log entries yet. Use 'add' to create the first entry.")
        return 0
    rows: List[List[str]] = []
    for e in entries:
        rows.append([
            str(e.id),
            e.departure_port,
            e.destination_port,
            e.departure_datetime,
            e.arrival_datetime,
            f"{e.distance_nm:.1f}",
        ])
    table = _format_table(
        rows,
        headers=["ID", "From", "To", "Depart (UTC)", "Arrive (UTC)", "NM"],
    )
    print(table)
    return 0


def command_summary(args: argparse.Namespace) -> int:
    entries = read_all_entries(args.csv)
    if not entries:
        print("No entries to summarize.")
        return 0
    total_nm = sum(e.distance_nm for e in entries)
    passages = len(entries)
    total_duration = dt.timedelta()
    for e in entries:
        try:
            depart = parse_datetime(e.departure_datetime)
            arrive = parse_datetime(e.arrival_datetime)
            total_duration += (arrive - depart)
        except Exception:
            continue
    total_hours = total_duration.total_seconds() / 3600.0
    rows = [
        ["Passages", str(passages)],
        ["Total distance (nm)", f"{total_nm:.1f}"],
        ["Total duration (hours)", f"{total_hours:.1f}"],
    ]
    print(_format_table(rows, headers=["Metric", "Value"]))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Maritime Logbook CLI",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--csv",
        default=DEFAULT_CSV_PATH,
        help="Path to the logbook CSV file",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_add = subparsers.add_parser("add", help="Add a new passage")
    p_add.add_argument("--departure", required=True, help="Departure port")
    p_add.add_argument("--destination", required=True, help="Destination port")
    p_add.add_argument(
        "--depart",
        required=True,
        help="Departure datetime (ISO 8601, e.g., 2025-08-14T09:30Z)",
    )
    p_add.add_argument(
        "--arrive",
        required=True,
        help="Arrival datetime (ISO 8601, e.g., 2025-08-14T21:45Z)",
    )
    p_add.add_argument(
        "--distance",
        required=True,
        help="Distance sailed in nautical miles",
    )
    p_add.set_defaults(func=command_add)

    p_list = subparsers.add_parser("list", help="List logbook entries")
    p_list.set_defaults(func=command_list)

    p_sum = subparsers.add_parser("summary", help="Show totals and summary")
    p_sum.set_defaults(func=command_summary)

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())

