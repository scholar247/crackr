PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Departments (
  DepartmentID INTEGER PRIMARY KEY AUTOINCREMENT,
  DepartmentName TEXT NOT NULL,
  Location TEXT
);

CREATE TABLE IF NOT EXISTS Employees (
  EmployeeID INTEGER PRIMARY KEY AUTOINCREMENT,
  FirstName TEXT,
  LastName TEXT,
  DepartmentID INTEGER,
  HireDate TEXT,
  Email TEXT,
  PhoneNumber TEXT,
  FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
);

CREATE TABLE IF NOT EXISTS Projects (
  ProjectID INTEGER PRIMARY KEY AUTOINCREMENT,
  ProjectName TEXT,
  StartDate TEXT,
  EndDate TEXT,
  Budget REAL
);

CREATE TABLE IF NOT EXISTS Salaries (
  EmployeeID INTEGER,
  Salary REAL,
  SalaryDate TEXT,
  PRIMARY KEY (EmployeeID, SalaryDate),
  FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID)
);

CREATE TABLE IF NOT EXISTS Assignments (
  EmployeeID INTEGER,
  ProjectID INTEGER,
  Role TEXT,
  PRIMARY KEY (EmployeeID, ProjectID),
  FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
  FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID)
);

-- Departments
INSERT OR IGNORE INTO Departments (DepartmentName, Location) VALUES
('Human Resources', 'New York'),
('Finance', 'London'),
('Marketing', 'Berlin'),
('Research & Development', 'San Francisco'),
('Sales', 'Tokyo');

-- Employees
INSERT OR IGNORE INTO Employees (FirstName, LastName, DepartmentID, HireDate, Email, PhoneNumber) VALUES
('John', 'Doe', 1, '2015-06-15', 'johndoe@example.com', '123-456-7890'),
('Jane', 'Smith', 2, '2018-03-22', 'janesmith@example.com', '234-567-8901'),
('Alice', 'Johnson', 3, '2020-01-10', 'alicej@example.com', '345-678-9012'),
('Bob', 'Brown', 4, '2017-11-05', 'bobbrown@example.com', '456-789-0123'),
('Charlie', 'Davis', 5, '2016-08-30', 'charlied@example.com', '567-890-1234'),
('David', 'Wilson', 1, '2019-12-01', 'davidw@example.com', '678-901-2345'),
('Eve', 'Taylor', 2, '2021-05-12', 'evetaylor@example.com', '789-012-3456'),
('Frank', 'Moore', 3, '2022-09-17', 'frankm@example.com', '890-123-4567'),
('Grace', 'Lee', 4, '2018-10-25', 'gracelee@example.com', '901-234-5678'),
('Hannah', 'King', 5, '2020-06-11', 'hannahk@example.com', '012-345-6789');

-- Projects
INSERT OR IGNORE INTO Projects (ProjectName, StartDate, EndDate, Budget) VALUES
('Project Alpha', '2023-01-01', '2023-06-30', 100000.00),
('Project Beta', '2022-05-15', '2023-05-15', 150000.00),
('Project Gamma', '2021-11-01', '2022-11-01', 200000.00),
('Project Delta', '2023-02-01', '2023-12-31', 250000.00),
('Project Epsilon', '2020-08-15', '2021-08-15', 300000.00);

-- Salaries
INSERT OR IGNORE INTO Salaries (EmployeeID, Salary, SalaryDate) VALUES
(1, 60000.00, '2023-01-01'),
(2, 75000.00, '2023-01-01'),
(3, 80000.00, '2023-01-01'),
(4, 85000.00, '2023-01-01'),
(5, 90000.00, '2023-01-01'),
(6, 95000.00, '2023-01-01'),
(7, 70000.00, '2023-01-01'),
(8, 76000.00, '2023-01-01'),
(9, 78000.00, '2023-01-01'),
(10, 72000.00, '2023-01-01');

-- Assignments
INSERT OR IGNORE INTO Assignments (EmployeeID, ProjectID, Role) VALUES
(1, 1, 'Team Lead'),
(2, 1, 'Developer'),
(3, 2, 'Designer'),
(4, 3, 'Project Manager'),
(5, 4, 'Tester'),
(6, 4, 'Developer'),
(7, 2, 'Team Lead'),
(8, 3, 'Developer'),
(9, 5, 'Tester'),
(10, 5, 'Developer');
