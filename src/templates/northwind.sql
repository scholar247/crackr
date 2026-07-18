PRAGMA foreign_keys = ON;

-- 1. Customers
CREATE TABLE Customers (
  CustomerID TEXT PRIMARY KEY,
  CompanyName TEXT NOT NULL,
  ContactName TEXT,
  Country TEXT
);

-- 2. Employees
CREATE TABLE Employees (
  EmployeeID INTEGER PRIMARY KEY AUTOINCREMENT,
  FirstName TEXT NOT NULL,
  LastName TEXT NOT NULL,
  Title TEXT
);

-- 3. Suppliers
CREATE TABLE Suppliers (
  SupplierID INTEGER PRIMARY KEY,
  CompanyName TEXT NOT NULL
);

-- 4. Categories
CREATE TABLE Categories (
  CategoryID INTEGER PRIMARY KEY AUTOINCREMENT,
  CategoryName TEXT NOT NULL,
  Description TEXT
);

-- 5. Products
CREATE TABLE Products (
  ProductID INTEGER PRIMARY KEY AUTOINCREMENT,
  ProductName TEXT NOT NULL,
  SupplierID INTEGER,
  CategoryID INTEGER,
  QuantityPerUnit TEXT,
  UnitPrice REAL,
  UnitsInStock INTEGER,
  FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID),
  FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

-- 6. Orders
CREATE TABLE Orders (
  OrderID INTEGER PRIMARY KEY AUTOINCREMENT,
  CustomerID TEXT,
  EmployeeID INTEGER,
  OrderDate TEXT,
  ShipCountry TEXT,
  FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
  FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID)
);

-- 7. OrderDetails
CREATE TABLE OrderDetails (
  OrderID INTEGER,
  ProductID INTEGER,
  UnitPrice REAL,
  Quantity INTEGER,
  Discount REAL,
  PRIMARY KEY (OrderID, ProductID),
  FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
  FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

INSERT INTO Customers (CustomerID, CompanyName, ContactName, Country) VALUES
('ALFKI', 'Alfreds Futterkiste', 'Maria Anders', 'Germany'),
('ANATR', 'Ana Trujillo Emparedados', 'Ana Trujillo', 'Mexico'),
('ANTON', 'Antonio Moreno Taquería', 'Antonio Moreno', 'Mexico'),
('AROUT', 'Around the Horn', 'Thomas Hardy', 'UK'),
('BERGS', 'Berglunds snabbköp', 'Christina Berglund', 'Sweden'),
('BLAUS', 'Blauer See Delikatessen', 'Hanna Moos', 'Germany'),
('BLONP', 'Blondel père et fils', 'Frédérique Citeaux', 'France'),
('BOLID', 'Bólido Comidas preparadas', 'Martín Sommer', 'Spain'),
('BONAP', 'Bon app', 'Laurence Lebihan', 'France'),
('BOTTM', 'Bottom-Dollar Markets', 'Elizabeth Lincoln', 'Canada');

INSERT INTO Employees (FirstName, LastName, Title) VALUES
('Nancy', 'Davolio', 'Sales Representative'),
('Andrew', 'Fuller', 'Vice President'),
('Janet', 'Leverling', 'Sales Representative'),
('Margaret', 'Peacock', 'Sales Representative'),
('Steven', 'Buchanan', 'Sales Manager'),
('Michael', 'Suyama', 'Sales Representative'),
('Robert', 'King', 'Sales Representative'),
('Laura', 'Callahan', 'Inside Sales Coordinator'),
('Anne', 'Dodsworth', 'Sales Representative'),
('John', 'Smith', 'Account Executive');

INSERT INTO Suppliers (SupplierID, CompanyName) VALUES
(1, 'Exotic Liquids'),
(2, 'New Orleans Cajun Delights'),
(3, 'Grandma Kelly''s Homestead'),
(4, 'Tokyo Traders'),
(5, 'Cooperativa de Quesos'),
(6, 'Mayumi''s');


INSERT INTO Categories (CategoryName, Description) VALUES
('Beverages', 'Soft drinks, coffee, tea, beers, and ales'),
('Condiments', 'Sweet and savory sauces, relishes, spreads, and seasonings'),
('Confections', 'Desserts, candies, and sweet breads'),
('Dairy Products', 'Cheeses'),
('Grains/Cereals', 'Breads, crackers, pasta, and cereal'),
('Meat/Poultry', 'Prepared meats'),
('Produce', 'Dried fruit and bean curd'),
('Seafood', 'Seaweed and fish'),
('Snacks', 'Chips and munchies'),
('Bakery', 'Breads and baked goods');


INSERT INTO Products (ProductName, SupplierID, CategoryID, QuantityPerUnit, UnitPrice, UnitsInStock) VALUES
('Chai', 1, 1, '10 boxes x 20 bags', 18.00, 39),
('Chang', 1, 1, '24 - 12 oz bottles', 19.00, 17),
('Aniseed Syrup', 1, 2, '12 - 550 ml bottles', 10.00, 13),
('Chef Anton''s Cajun Seasoning', 2, 2, '48 - 6 oz jars', 22.00, 53),
('Grandma''s Boysenberry Spread', 2, 2, '12 - 8 oz jars', 25.00, 120),
('Chocolate Biscuits', 3, 3, '20 - 100 g boxes', 15.00, 25),
('Gnocchi di nonna Alice', 3, 5, '24 - 250 g pkgs.', 38.00, 21),
('Ikura', 4, 8, '12 - 200 ml jars', 31.00, 15),
('Queso Cabrales', 5, 4, '1 kg pkg.', 21.00, 22),
('Tofu', 6, 7, '40 - 100 g pkgs.', 23.25, 35);


INSERT INTO Orders (CustomerID, EmployeeID, OrderDate, ShipCountry) VALUES
('ALFKI', 1, '2023-01-10', 'Germany'),
('ANATR', 2, '2023-01-15', 'Mexico'),
('AROUT', 1, '2023-01-20', 'UK'),
('BERGS', 3, '2023-02-01', 'Sweden'),
('ANTON', 2, '2023-02-10', 'Mexico'),
('BLAUS', 4, '2023-02-15', 'Germany'),
('BONAP', 5, '2023-02-20', 'France'),
('BOTTM', 6, '2023-03-01', 'Canada'),
('BLONP', 7, '2023-03-10', 'France'),
('BOLID', 8, '2023-03-15', 'Spain');


INSERT INTO OrderDetails (OrderID, ProductID, UnitPrice, Quantity, Discount) VALUES
(1, 1, 18.00, 10, 0),
(1, 2, 19.00, 5, 0),
(2, 3, 10.00, 12, 0.1),
(2, 5, 25.00, 4, 0),
(3, 4, 22.00, 6, 0),
(3, 6, 15.00, 3, 0),
(4, 2, 19.00, 2, 0.05),
(4, 3, 10.00, 8, 0),
(5, 1, 18.00, 1, 0),
(5, 6, 15.00, 10, 0.2);
