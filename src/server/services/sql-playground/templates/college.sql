PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Departments (
  DepartmentID INTEGER PRIMARY KEY AUTOINCREMENT,
  DepartmentName TEXT,
  Location TEXT
);

CREATE TABLE IF NOT EXISTS Students (
  StudentID INTEGER PRIMARY KEY AUTOINCREMENT,
  FirstName TEXT,
  LastName TEXT,
  DepartmentID INTEGER,
  EnrollmentDate TEXT,
  Email TEXT,
  PhoneNumber TEXT,
  FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
);

CREATE TABLE IF NOT EXISTS Faculty (
  FacultyID INTEGER PRIMARY KEY AUTOINCREMENT,
  FirstName TEXT,
  LastName TEXT,
  DepartmentID INTEGER,
  HireDate TEXT,
  Email TEXT,
  PhoneNumber TEXT,
  FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
);

CREATE TABLE IF NOT EXISTS Courses (
  CourseID INTEGER PRIMARY KEY AUTOINCREMENT,
  CourseName TEXT,
  Credits INTEGER,
  DepartmentID INTEGER,
  FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
);

CREATE TABLE IF NOT EXISTS Enrollments (
  StudentID INTEGER,
  CourseID INTEGER,
  Grade TEXT,
  PRIMARY KEY (StudentID, CourseID),
  FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
  FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
);

CREATE TABLE IF NOT EXISTS LibraryBooks (
  BookID INTEGER PRIMARY KEY AUTOINCREMENT,
  Title TEXT,
  Author TEXT,
  ISBN TEXT,
  Available INTEGER -- SQLite uses INTEGER for boolean (0 = false, 1 = true)
);

CREATE TABLE IF NOT EXISTS BookIssues (
  IssueID INTEGER PRIMARY KEY AUTOINCREMENT,
  BookID INTEGER,
  StudentID INTEGER,
  IssueDate TEXT,
  ReturnDate TEXT,
  FOREIGN KEY (BookID) REFERENCES LibraryBooks(BookID),
  FOREIGN KEY (StudentID) REFERENCES Students(StudentID)
);

-- Departments
INSERT OR IGNORE INTO Departments (DepartmentName, Location) VALUES
('Computer Science', 'Block A'),
('Mechanical Engineering', 'Block B'),
('Electrical Engineering', 'Block C'),
('Civil Engineering', 'Block D'),
('Business Administration', 'Block E');

-- Students
INSERT OR IGNORE INTO Students (FirstName, LastName, DepartmentID, EnrollmentDate, Email, PhoneNumber) VALUES
('Amit', 'Sharma', 1, '2021-08-01', 'amit.sharma@college.edu', '9876543210'),
('Riya', 'Verma', 2, '2020-07-15', 'riya.verma@college.edu', '8765432109'),
('Karan', 'Singh', 3, '2022-01-10', 'karan.singh@college.edu', '7654321098'),
('Neha', 'Yadav', 4, '2021-09-20', 'neha.yadav@college.edu', '6543210987'),
('Vikram', 'Patel', 5, '2019-06-25', 'vikram.patel@college.edu', '5432109876'),
('Priya', 'Desai', 1, '2023-01-05', 'priya.desai@college.edu', '4321098765');

-- Faculty
INSERT OR IGNORE INTO Faculty (FirstName, LastName, DepartmentID, HireDate, Email, PhoneNumber) VALUES
('Dr. Anil', 'Kumar', 1, '2015-06-15', 'anil.kumar@college.edu', '9988776655'),
('Dr. Seema', 'Mehta', 2, '2016-07-20', 'seema.mehta@college.edu', '9877665544'),
('Dr. Rahul', 'Gupta', 3, '2017-08-25', 'rahul.gupta@college.edu', '9766554433'),
('Dr. Alka', 'Joshi', 4, '2018-09-30', 'alka.joshi@college.edu', '9655443322'),
('Dr. Manoj', 'Rao', 5, '2019-10-05', 'manoj.rao@college.edu', '9544332211');

-- Courses
INSERT OR IGNORE INTO Courses (CourseName, Credits, DepartmentID) VALUES
('Data Structures', 4, 1),
('Thermodynamics', 3, 2),
('Circuits & Systems', 4, 3),
('Structural Analysis', 3, 4),
('Marketing Management', 3, 5),
('Algorithms', 4, 1);

-- Enrollments
INSERT OR IGNORE INTO Enrollments (StudentID, CourseID, Grade) VALUES
(1, 1, 'A'),
(2, 2, 'B'),
(3, 3, 'A'),
(4, 4, 'C'),
(5, 5, 'B'),
(6, 6, 'A');

-- LibraryBooks
INSERT OR IGNORE INTO LibraryBooks (Title, Author, ISBN, Available) VALUES
('Introduction to Algorithms', 'CLRS', '9780262033848', 1),
('Thermal Engineering', 'R.K. Rajput', '9788174091620', 1),
('Basic Electrical Engineering', 'V.K. Mehta', '9789352834207', 0),
('Civil Engineering Materials', 'Sharma & Kaushik', '9788121931931', 1),
('Principles of Marketing', 'Philip Kotler', '9780134492513', 0),
('Python Programming', 'Reema Thareja', '9780199480170', 1);

-- BookIssues
INSERT OR IGNORE INTO BookIssues (BookID, StudentID, IssueDate, ReturnDate) VALUES
(3, 1, '2024-01-15', '2024-02-15'),
(5, 2, '2024-02-01', NULL),
(2, 3, '2024-03-10', '2024-03-30'),
(4, 4, '2024-01-05', '2024-01-20'),
(1, 5, '2024-04-01', NULL),
(6, 6, '2024-04-10', NULL);
