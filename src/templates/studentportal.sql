PRAGMA foreign_keys = ON;

-- 1. StudentProfiles
CREATE TABLE IF NOT EXISTS StudentProfiles (
  StudentID INTEGER PRIMARY KEY,
  FirstName TEXT,
  LastName TEXT,
  DOB DATE,
  Gender TEXT,
  Email TEXT,
  Phone TEXT
);

-- 2. AcademicRecords
CREATE TABLE IF NOT EXISTS AcademicRecords (
  RecordID INTEGER PRIMARY KEY,
  StudentID INTEGER,
  Semester INTEGER,
  GPA REAL,
  Year INTEGER,
  FOREIGN KEY (StudentID) REFERENCES StudentProfiles(StudentID)
);

-- 3. Attendance
CREATE TABLE IF NOT EXISTS Attendance (
  AttendanceID INTEGER PRIMARY KEY,
  StudentID INTEGER,
  Date DATE,
  Status TEXT,
  FOREIGN KEY (StudentID) REFERENCES StudentProfiles(StudentID)
);

-- 4. Fees
CREATE TABLE IF NOT EXISTS Fees (
  FeeID INTEGER PRIMARY KEY,
  StudentID INTEGER,
  Amount REAL,
  PaidDate DATE,
  Status TEXT,
  FOREIGN KEY (StudentID) REFERENCES StudentProfiles(StudentID)
);

-- 5. Guardians
CREATE TABLE IF NOT EXISTS Guardians (
  GuardianID INTEGER PRIMARY KEY,
  StudentID INTEGER,
  Name TEXT,
  Relation TEXT,
  Contact TEXT,
  FOREIGN KEY (StudentID) REFERENCES StudentProfiles(StudentID)
);

-- 6. LoginCredentials
CREATE TABLE IF NOT EXISTS LoginCredentials (
  StudentID INTEGER PRIMARY KEY,
  Username TEXT,
  PasswordHash TEXT,
  LastLogin DATETIME,
  FOREIGN KEY (StudentID) REFERENCES StudentProfiles(StudentID)
);

-- 7. Complaints
CREATE TABLE IF NOT EXISTS Complaints (
  ComplaintID INTEGER PRIMARY KEY,
  StudentID INTEGER,
  ComplaintText TEXT,
  SubmittedOn DATE,
  Status TEXT,
  FOREIGN KEY (StudentID) REFERENCES StudentProfiles(StudentID)
);

-- StudentProfiles
INSERT OR IGNORE INTO StudentProfiles (FirstName, LastName, DOB, Gender, Email, Phone) VALUES
('Rohan', 'Singh', '2003-05-10', 'Male', 'rohan@portal.edu', '9876543210'),
('Simran', 'Kaur', '2002-08-25', 'Female', 'simran@portal.edu', '8765432109'),
('Aditya', 'Mehra', '2004-01-12', 'Male', 'aditya@portal.edu', '7654321098'),
('Tina', 'Shah', '2003-03-03', 'Female', 'tina@portal.edu', '6543210987'),
('Dev', 'Patel', '2002-12-20', 'Male', 'dev@portal.edu', '5432109876'),
('Meena', 'Nair', '2004-06-18', 'Female', 'meena@portal.edu', '4321098765');

-- AcademicRecords
INSERT OR IGNORE INTO AcademicRecords (StudentID, Semester, GPA, Year) VALUES
(1, 1, 8.2, 2022),
(2, 2, 8.5, 2022),
(3, 3, 7.9, 2023),
(4, 4, 9.0, 2023),
(5, 5, 8.7, 2024),
(6, 6, 9.2, 2024);

-- Attendance
INSERT OR IGNORE INTO Attendance (StudentID, Date, Status) VALUES
(1, '2024-04-01', 'Present'),
(2, '2024-04-01', 'Absent'),
(3, '2024-04-01', 'Present'),
(4, '2024-04-01', 'Present'),
(5, '2024-04-01', 'Late'),
(6, '2024-04-01', 'Present');

-- Fees
INSERT OR IGNORE INTO Fees (StudentID, Amount, PaidDate, Status) VALUES
(1, 25000.00, '2024-03-15', 'Paid'),
(2, 25000.00, '2024-03-20', 'Pending'),
(3, 25000.00, '2024-03-22', 'Paid'),
(4, 25000.00, '2024-03-24', 'Paid'),
(5, 25000.00, '2024-03-26', 'Paid'),
(6, 25000.00, '2024-03-28', 'Pending');

-- Guardians
INSERT OR IGNORE INTO Guardians (StudentID, Name, Relation, Contact) VALUES
(1, 'Raj Singh', 'Father', '9998877665'),
(2, 'Asha Kaur', 'Mother', '9887766554'),
(3, 'Mahesh Mehra', 'Father', '9776655443'),
(4, 'Anita Shah', 'Mother', '9665544332'),
(5, 'Suresh Patel', 'Father', '9554433221'),
(6, 'Ravi Nair', 'Father', '9443322110');

-- LoginCredentials
INSERT OR IGNORE INTO LoginCredentials (StudentID, Username, PasswordHash, LastLogin) VALUES
(1, 'rohan123', 'abc123hash', '2024-04-10 10:00:00'),
(2, 'simran456', 'xyz789hash', '2024-04-11 12:30:00'),
(3, 'adi999', 'mno321hash', '2024-04-12 08:15:00'),
(4, 'tina@123', 'def456hash', '2024-04-13 09:45:00'),
(5, 'dev007', 'uvw987hash', '2024-04-14 11:20:00'),
(6, 'meena998', 'pqr654hash', '2024-04-14 13:50:00');

-- Complaints
INSERT OR IGNORE INTO Complaints (StudentID, ComplaintText, SubmittedOn, Status) VALUES
(1, 'WiFi not working', '2024-03-15', 'Resolved'),
(2, 'Fan broken in classroom', '2024-03-16', 'Pending'),
(3, 'Canteen food quality issue', '2024-03-17', 'In Progress'),
(4, 'Projector not working', '2024-03-18', 'Resolved'),
(5, 'Water cooler leakage', '2024-03-19', 'Pending'),
(6, 'Delay in grade publishing', '2024-03-20', 'Resolved');


