"""Load valid JSON employee records into a local SQLite teaching database.

No external Python packages are needed. Invalid rows are reported and skipped;
the first valid occurrence of each employee_id in a batch wins. All accepted
rows load in one transaction. Existing database IDs cause the entire load to
roll back; existing records are not overwritten.
"""
import argparse
import json
import math
import sqlite3
import sys
from contextlib import closing
from pathlib import Path

STATES = {'MI': 26, 'WY': 56, 'VA': 51}


def positive_integer(value):
    if isinstance(value, bool) or not isinstance(value, (str, int, float)):
        raise ValueError('employee_id must be a positive integer')
    try:
        number = float(value)
    except (ValueError, OverflowError) as error:
        raise ValueError('employee_id must be a positive integer') from error
    if not math.isfinite(number) or not number.is_integer() or not 0 < number <= 9007199254740991:
        raise ValueError('employee_id must be a positive safe integer')
    return int(number)


def transform(records):
    if not isinstance(records, list):
        raise ValueError('Input must be a JSON array of employee records')
    accepted, rejected, seen = [], [], set()
    for index, row in enumerate(records, 1):
        try:
            if not isinstance(row, dict):
                raise ValueError('record must be an object')
            employee_id = positive_integer(row.get('employee_id'))
            if not isinstance(row.get('name'), str) or not row['name'].strip():
                raise ValueError('name must be nonblank text')
            state = row.get('state')
            if isinstance(state, bool) or not isinstance(state, (str, int, float)):
                raise ValueError('state must be MI, WY, VA, 26, 56, or 51')
            key = str(state).strip().upper()
            state_code = STATES.get(key)
            if state_code is None:
                try:
                    number = float(state)
                    if number in STATES.values():
                        state_code = int(number)
                except (ValueError, OverflowError):
                    pass
            if state_code is None:
                raise ValueError('unknown state')
            if employee_id in seen:
                raise ValueError('duplicate employee_id in this batch')
            seen.add(employee_id)
            accepted.append((employee_id, row['name'].strip(), state_code))
        except ValueError as error:
            rejected.append((index, str(error)))
    return accepted, rejected


def load(connection, rows):
    # A connection context commits on success and rolls back on an exception.
    # It does not close the connection; the caller owns that resource.
    with connection:
        connection.executemany(
            'INSERT INTO imported_employees (employee_id, name, state_code) '
            'VALUES (?, ?, ?)',
            rows,
        )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('--database', type=Path, default=Path('lecture05.sqlite'))
    args = parser.parse_args()
    try:
        accepted, rejected = transform(json.loads(args.input.read_text(encoding='utf-8')))
        for row, reason in rejected:
            print(f'Row {row} skipped: {reason}', file=sys.stderr)
        with closing(sqlite3.connect(args.database)) as connection:
            connection.execute('''CREATE TABLE IF NOT EXISTS imported_employees (
                employee_id INTEGER PRIMARY KEY CHECK (employee_id > 0),
                name TEXT NOT NULL CHECK (length(trim(name)) > 0),
                state_code INTEGER NOT NULL CHECK (state_code IN (26, 56, 51))
            )''')
            load(connection, accepted)
            for row in connection.execute('SELECT * FROM imported_employees ORDER BY employee_id'):
                print(row)
        print(f'Loaded {len(accepted)} rows; skipped {len(rejected)} rows.')
    except (OSError, ValueError, sqlite3.Error) as error:
        print(f'Load failed: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
