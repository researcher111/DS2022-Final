"""Read employees from the MySQL restaurant example with a bound parameter.

Install: uv pip install mysql-connector-python
Run after setting DB_HOST, DB_USER, DB_PASSWORD, DB_NAME:
    python query_mysql.py --state 56
Source: https://dev.mysql.com/doc/connector-python/en/connector-python-api-mysqlcursor-execute.html
"""
import argparse
import os
from contextlib import closing

import mysql.connector


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=int, default=56)
    args = parser.parse_args()
    config = {
        'host': os.environ['DB_HOST'],
        'port': int(os.environ.get('DB_PORT', '3306')),
        'user': os.environ['DB_USER'],
        'password': os.environ['DB_PASSWORD'],
        'database': os.environ['DB_NAME'],
        'connection_timeout': 10,
    }
    with closing(mysql.connector.connect(**config)) as conn:
        with closing(conn.cursor(dictionary=True)) as cursor:
            cursor.execute(
                'SELECT employee_id, name FROM employees '
                'WHERE state_code = %s ORDER BY employee_id',
                (args.state,),
            )
            for row in cursor.fetchall():
                print(row['employee_id'], row['name'])
    # For INSERT / UPDATE / DELETE, explicitly commit on success and roll back
    # on failure. Closing a cursor or connection does not commit a transaction.


if __name__ == '__main__':
    main()
