PRAGMA foreign_keys = ON;

-- 1. Members Table
CREATE TABLE IF NOT EXISTS Members (
  MemberID INTEGER PRIMARY KEY AUTOINCREMENT,
  Name TEXT,
  Email TEXT,
  JoinDate TEXT,
  MembershipType TEXT
);

-- 2. Books Table
CREATE TABLE IF NOT EXISTS Books (
  BookID INTEGER PRIMARY KEY AUTOINCREMENT,
  Title TEXT,
  Author TEXT,
  ISBN TEXT,
  Category TEXT,
  Available INTEGER  -- Use 0/1 for BOOLEAN
);

-- 3. BookIssues Table
CREATE TABLE IF NOT EXISTS BookIssues (
  IssueID INTEGER PRIMARY KEY AUTOINCREMENT,
  BookID INTEGER,
  MemberID INTEGER,
  IssueDate TEXT,
  DueDate TEXT,
  ReturnDate TEXT,
  FOREIGN KEY (BookID) REFERENCES Books(BookID),
  FOREIGN KEY (MemberID) REFERENCES Members(MemberID)
);

-- 4. Fines Table
CREATE TABLE IF NOT EXISTS Fines (
  FineID INTEGER PRIMARY KEY AUTOINCREMENT,
  MemberID INTEGER,
  Amount REAL,
  Paid INTEGER,  -- Use 0/1 for BOOLEAN
  FineDate TEXT,
  FOREIGN KEY (MemberID) REFERENCES Members(MemberID)
);

-- 5. Librarians Table
CREATE TABLE IF NOT EXISTS Librarians (
  LibrarianID INTEGER PRIMARY KEY AUTOINCREMENT,
  Name TEXT,
  Email TEXT,
  HireDate TEXT
);

-- 6. Categories Table
CREATE TABLE IF NOT EXISTS Categories (
  CategoryID INTEGER PRIMARY KEY AUTOINCREMENT,
  CategoryName TEXT
);

-- 7. BookRequests Table
CREATE TABLE IF NOT EXISTS BookRequests (
  RequestID INTEGER PRIMARY KEY AUTOINCREMENT,
  MemberID INTEGER,
  BookTitle TEXT,
  Author TEXT,
  RequestDate TEXT,
  Status TEXT,
  FOREIGN KEY (MemberID) REFERENCES Members(MemberID)
);

-- Insert Members
INSERT OR IGNORE INTO Members (Name, Email, JoinDate, MembershipType) VALUES
('Ravi Shankar', 'ravi@library.edu', '2022-01-15', 'Student'),
('Meena Kapoor', 'meena@library.edu', '2022-03-12', 'Faculty'),
('Aman Joshi', 'aman@library.edu', '2023-06-05', 'Student'),
('Kiran Rao', 'kiran@library.edu', '2023-08-22', 'Student'),
('Sunil Desai', 'sunil@library.edu', '2024-01-10', 'Faculty'),
('Ruchi Mehta', 'ruchi@library.edu', '2024-02-01', 'Student');

-- Insert Categories
INSERT OR IGNORE INTO Categories (CategoryName) VALUES
('Engineering'), ('Management'), ('Science'), ('Literature'), ('History'), ('Technology');

-- Insert Books
INSERT OR IGNORE INTO Books (Title, Author, ISBN, Category, Available) VALUES
('Operating Systems', 'Galvin', '9788120345799', 'Engineering', 1),
('Marketing 101', 'Kotler', '9780134492513', 'Management', 1),
('Quantum Physics', 'Resnick', '9788120333284', 'Science', 0),
('Shakespeare Complete Works', 'William Shakespeare', '9780199267170', 'Literature', 1),
('Modern India', 'Bipan Chandra', '9788125036845', 'History', 1),
('Web Development', 'Jon Duckett', '9781118008188', 'Technology', 0);

-- Insert BookIssues
INSERT OR IGNORE INTO BookIssues (BookID, MemberID, IssueDate, DueDate, ReturnDate) VALUES
(1, 1, '2024-03-10', '2024-03-25', '2024-03-22'),
(3, 2, '2024-03-12', '2024-03-27', NULL),
(6, 3, '2024-04-01', '2024-04-16', NULL),
(5, 4, '2024-03-20', '2024-04-04', '2024-04-03'),
(2, 5, '2024-04-02', '2024-04-17', NULL),
(4, 6, '2024-03-15', '2024-03-30', '2024-03-28');

-- Insert Fines
INSERT OR IGNORE INTO Fines (MemberID, Amount, Paid, FineDate) VALUES
(1, 50.00, 1, '2024-03-26'),
(2, 100.00, 0, '2024-04-01'),
(3, 75.00, 0, '2024-04-10'),
(4, 0.00, 1, '2024-04-03'),
(5, 25.00, 0, '2024-04-13'),
(6, 30.00, 1, '2024-04-01');

-- Insert Librarians
INSERT OR IGNORE INTO Librarians (Name, Email, HireDate) VALUES
('Mr. Nitin Sharma', 'nitin@library.edu', '2020-05-10'),
('Ms. Pooja Jain', 'pooja@library.edu', '2021-07-22'),
('Mr. Ramesh Yadav', 'ramesh@library.edu', '2023-01-12');

-- Insert BookRequests
INSERT OR IGNORE INTO BookRequests (MemberID, BookTitle, Author, RequestDate, Status) VALUES
(1, 'Clean Code', 'Robert C. Martin', '2024-04-05', 'Pending'),
(2, 'Data Science Handbook', 'Jake VanderPlas', '2024-04-08', 'Approved'),
(3, 'Machine Learning', 'Tom Mitchell', '2024-04-10', 'Rejected'),
(4, 'Introduction to AI', 'Stuart Russell', '2024-04-11', 'Pending'),
(5, 'Deep Learning', 'Ian Goodfellow', '2024-04-13', 'Approved'),
(6, 'Design Patterns', 'Erich Gamma', '2024-04-14', 'Pending');
