import sqlite3
import unittest

from etl_sqlite import transform, load


class EtlTests(unittest.TestCase):
    def test_trim_normalize_and_keep_first_valid_identity(self):
        good, bad = transform([
            {'employee_id': 4, 'name': '', 'state': 'MI'},
            {'employee_id': '4', 'name': '  Cara  ', 'state': 'mi'},
            {'employee_id': 4, 'name': 'Another Cara', 'state': 'WY'},
            {'employee_id': 5, 'name': "O'Neil", 'state': '51'},
        ])
        self.assertEqual(good, [(4, 'Cara', 26), (5, "O'Neil", 51)])
        self.assertEqual([index for index, _ in bad], [1, 3])

    def test_bad_records_do_not_become_silent_defaults(self):
        records = [None, {}, {'employee_id': True, 'name': 'Ada', 'state': 'MI'},
                   {'employee_id': 1.5, 'name': 'Ada', 'state': 'MI'},
                   {'employee_id': 1, 'name': 'Ada', 'state': 'XX'},
                   {'employee_id': 'NaN', 'name': 'Ada', 'state': 'WY'}]
        good, bad = transform(records)
        self.assertEqual(good, [])
        self.assertEqual(len(bad), len(records))
        with self.assertRaises(ValueError):
            transform({'employee_id': 1})

    def test_binding_keeps_quotes_and_sql_as_data(self):
        with sqlite3.connect(':memory:') as connection:
            connection.execute('CREATE TABLE imported_employees (employee_id INTEGER PRIMARY KEY, name TEXT, state_code INTEGER)')
            name = "O'Neil'); DROP TABLE imported_employees; --"
            load(connection, [(1, name, 51)])
            self.assertEqual(connection.execute('SELECT name FROM imported_employees').fetchone(), (name,))

    def test_existing_id_rolls_back_the_whole_batch(self):
        with sqlite3.connect(':memory:') as connection:
            connection.execute('CREATE TABLE imported_employees (employee_id INTEGER PRIMARY KEY, name TEXT, state_code INTEGER)')
            load(connection, [(1, 'Alice', 26)])
            with self.assertRaises(sqlite3.IntegrityError):
                load(connection, [(2, 'Bob', 56), (1, 'Duplicate', 51)])
            self.assertEqual(connection.execute('SELECT * FROM imported_employees').fetchall(), [(1, 'Alice', 26)])


if __name__ == '__main__':
    unittest.main()
