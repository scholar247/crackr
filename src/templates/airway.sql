PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Airlines (
  AirlineID INTEGER PRIMARY KEY AUTOINCREMENT,
  AirlineName TEXT NOT NULL,
  Country TEXT
);

CREATE TABLE IF NOT EXISTS Flights (
  FlightID INTEGER PRIMARY KEY AUTOINCREMENT,
  AirlineID INTEGER,
  FlightNumber TEXT NOT NULL,
  DepartureTime TEXT,
  ArrivalTime TEXT,
  DepartureCity TEXT,
  ArrivalCity TEXT,
  FOREIGN KEY (AirlineID) REFERENCES Airlines(AirlineID)
);

CREATE TABLE IF NOT EXISTS Passengers (
  PassengerID INTEGER PRIMARY KEY AUTOINCREMENT,
  FirstName TEXT,
  LastName TEXT,
  DateOfBirth TEXT,
  PassportNumber TEXT,
  Nationality TEXT
);

CREATE TABLE IF NOT EXISTS Reservations (
  ReservationID INTEGER PRIMARY KEY AUTOINCREMENT,
  FlightID INTEGER,
  PassengerID INTEGER,
  ReservationDate TEXT,
  SeatNumber TEXT,
  Status TEXT,
  FOREIGN KEY (FlightID) REFERENCES Flights(FlightID),
  FOREIGN KEY (PassengerID) REFERENCES Passengers(PassengerID)
);

CREATE TABLE IF NOT EXISTS Staff (
  StaffID INTEGER PRIMARY KEY AUTOINCREMENT,
  FirstName TEXT,
  LastName TEXT,
  Role TEXT,
  HireDate TEXT,
  Email TEXT
);

CREATE TABLE IF NOT EXISTS FlightAssignments (
  FlightID INTEGER,
  StaffID INTEGER,
  Role TEXT,
  PRIMARY KEY (FlightID, StaffID),
  FOREIGN KEY (FlightID) REFERENCES Flights(FlightID),
  FOREIGN KEY (StaffID) REFERENCES Staff(StaffID)
);

-- Insert Data
INSERT OR IGNORE INTO Airlines (AirlineName, Country) VALUES
('Delta Airlines', 'USA'),
('Air India', 'India'),
('British Airways', 'UK'),
('Emirates', 'UAE'),
('Lufthansa', 'Germany');

INSERT OR IGNORE INTO Flights (AirlineID, FlightNumber, DepartureTime, ArrivalTime, DepartureCity, ArrivalCity) VALUES
(1, 'DL101', '2023-04-20 07:00:00', '2023-04-20 10:00:00', 'New York', 'Los Angeles'),
(2, 'AI202', '2023-04-21 12:00:00', '2023-04-21 15:00:00', 'Delhi', 'Mumbai'),
(3, 'BA303', '2023-04-22 08:00:00', '2023-04-22 11:00:00', 'London', 'Paris'),
(4, 'EK404', '2023-04-23 16:00:00', '2023-04-23 20:00:00', 'Dubai', 'Singapore'),
(5, 'LH505', '2023-04-24 10:00:00', '2023-04-24 14:00:00', 'Frankfurt', 'Zurich');

INSERT OR IGNORE INTO Passengers (FirstName, LastName, DateOfBirth, PassportNumber, Nationality) VALUES
('John', 'Doe', '1985-06-15', 'A1234567', 'USA'),
('Jane', 'Smith', '1990-09-25', 'B2345678', 'UK'),
('Alice', 'Johnson', '1980-11-12', 'C3456789', 'Canada'),
('Bob', 'Brown', '1975-04-05', 'D4567890', 'Australia'),
('Charlie', 'Davis', '1995-07-30', 'E5678901', 'India');

INSERT OR IGNORE INTO Reservations (FlightID, PassengerID, ReservationDate, SeatNumber, Status) VALUES
(1, 1, '2023-04-15 09:00:00', 'A1', 'Confirmed'),
(2, 2, '2023-04-16 10:00:00', 'B2', 'Pending'),
(3, 3, '2023-04-17 11:30:00', 'C3', 'Cancelled'),
(4, 4, '2023-04-18 14:00:00', 'D4', 'Confirmed'),
(5, 5, '2023-04-19 08:30:00', 'E5', 'Confirmed');

INSERT OR IGNORE INTO Staff (FirstName, LastName, Role, HireDate, Email) VALUES
('Michael', 'Johnson', 'Pilot', '2010-06-15', 'mjohnson@airway.com'),
('Sarah', 'Williams', 'Flight Attendant', '2012-03-25', 'swilliams@airway.com'),
('David', 'Martinez', 'Pilot', '2015-07-19', 'dmartinez@airway.com'),
('Emily', 'Brown', 'Flight Attendant', '2018-01-30', 'ebrown@airway.com'),
('James', 'Davis', 'Pilot', '2011-09-10', 'jdavis@airway.com');

INSERT OR IGNORE INTO FlightAssignments (FlightID, StaffID, Role) VALUES
(1, 1, 'Pilot'),
(1, 2, 'Flight Attendant'),
(2, 3, 'Pilot'),
(2, 4, 'Flight Attendant'),
(3, 5, 'Pilot'),
(4, 1, 'Pilot'),
(5, 2, 'Flight Attendant');
