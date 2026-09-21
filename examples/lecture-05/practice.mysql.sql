-- Load restaurant.mysql.sql once before running these examples.
USE ds2022_lecture05;
DESCRIBE employees;

-- Read: both employees named Alice.
SELECT employee_id, name, state_code
FROM employees
WHERE name = 'Alice'
ORDER BY employee_id;

-- Read: filter, sort, then limit the displayed result.
SELECT employee_id, name
FROM employees
WHERE state_code = 56 AND (name = 'Alice' OR name = 'Bob')
ORDER BY employee_id
LIMIT 2;

-- A view stores a query. A normal view reflects the underlying table data.
CREATE OR REPLACE VIEW employee_states AS
SELECT e.employee_id, e.name, s.home_state
FROM employees AS e
JOIN states AS s ON s.state_code = e.state_code;
SELECT * FROM employee_states ORDER BY employee_id;

-- Create a row, change it, then remove it in one transaction.
START TRANSACTION;
INSERT INTO employees (employee_id, name, state_code) VALUES (4, 'Cara', 26);
UPDATE employees SET state_code = 56 WHERE employee_id = 4;
SELECT * FROM employees WHERE employee_id = 4;
DELETE FROM employees WHERE employee_id = 4;
COMMIT;

-- Preview an update and undo it. Only employee 1 moves, not employee 3.
START TRANSACTION;
UPDATE employees SET state_code = 56 WHERE employee_id = 1;
SELECT * FROM employee_states ORDER BY employee_id;
ROLLBACK;

-- DROP removes the view definition; employees and states remain.
DROP VIEW employee_states;
