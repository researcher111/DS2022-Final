-- MySQL 8+ teaching database. Run once with permission to create a database.
-- This deliberately stops on an existing database instead of replacing data.
CREATE DATABASE ds2022_lecture05;
USE ds2022_lecture05;

CREATE TABLE states (
    state_code INT PRIMARY KEY,
    home_state VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE employees (
    employee_id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    state_code INT NOT NULL,
    FOREIGN KEY (state_code) REFERENCES states(state_code)
) ENGINE=InnoDB;

CREATE TABLE jobs (
    job_code VARCHAR(3) PRIMARY KEY,
    job VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE employee_jobs (
    employee_id INT NOT NULL,
    job_code VARCHAR(3) NOT NULL,
    PRIMARY KEY (employee_id, job_code),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    FOREIGN KEY (job_code) REFERENCES jobs(job_code)
) ENGINE=InnoDB;

INSERT INTO states VALUES (26, 'Michigan'), (56, 'Wyoming');
INSERT INTO employees VALUES (1, 'Alice', 26), (2, 'Bob', 56), (3, 'Alice', 56);
INSERT INTO jobs VALUES ('J01', 'Chef'), ('J02', 'Waiter'), ('J03', 'Bartender');
INSERT INTO employee_jobs VALUES (1, 'J01'), (1, 'J02'), (2, 'J02'), (2, 'J03'), (3, 'J01');

-- The two employees named Alice have different identities.
SELECT e.employee_id, e.name, j.job, s.home_state
FROM employees AS e
JOIN employee_jobs AS ej ON ej.employee_id = e.employee_id
JOIN jobs AS j ON j.job_code = ej.job_code
JOIN states AS s ON s.state_code = e.state_code
ORDER BY e.employee_id, j.job_code;
