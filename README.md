# Maritime Logbook CLI

Simple CSV-backed logbook for maritime passages.

## Install

No install required; run the script directly with Python 3.9+.

```bash
python3 logbook.py --help
```

## CSV storage

Default file: `./logbook.csv` (override with `LOGBOOK_CSV` env or `--csv` flag).

Columns:
- id
- departure_port
- destination_port
- departure_datetime (UTC ISO 8601)
- arrival_datetime (UTC ISO 8601)
- distance_nm
- captain
- crew (comma-separated)
- sea_state
- wind_speed_kt
- wind_direction_deg
- created_at
- updated_at

## Usage

Add a passage:
```bash
python3 logbook.py add \
  --departure "Lisbon" \
  --destination "Madeira" \
  --depart "2025-08-14T08:00Z" \
  --arrive "2025-08-15T06:30Z" \
  --distance 530 \
  --captain "A. Silva" \
  --crew "B. Costa, C. Lima" \
  --sea-state "Moderate" \
  --wind-speed 18 \
  --wind-dir 040
```

List entries:
```bash
python3 logbook.py list
```

Summary:
```bash
python3 logbook.py summary
```
