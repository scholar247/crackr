export {};
/**
 * NIMCET Computer Awareness — Part 2 (topics 7–12)
 * Run: npx tsx scripts/seed-nimcet-ca-part2.ts
 */

const BASE = 'https://scholar247.org';
const KEY  = 'd846e4f1862433c8d265f459f5264b721c28a93057c9b7949d8a4cf98e7bdb9f';
const EXAM_ID    = '626534b9-0ac4-4d73-a400-7391b645338a';
const SUBJECT_ID = '14c706f0-dca1-42eb-a800-b7a04c7eb8bb';

const T = {
  DBMS:   '3daa49bd-af00-4181-a7c8-dde561d516d8',
  WEB:    '574fc0a9-5ce4-45f4-9cc5-bbb83cf74295',
  MEM:    'd37c946d-0b79-44ec-9587-a62fbc6c5a6d',
  NUMS:   'c91bbbc2-19c7-4cd2-a1b5-1bfc11b25e62',
  OOP:    '1ad0611a-bdc4-450f-95ad-8dc061505941',
  OS:     'e9ea9347-42c7-4df9-a681-e073102e8922',
};

type D = 'EASY'|'MEDIUM'|'HARD'|'EXPERT';
interface Q { topicId:string; difficulty:D; question:string; options:{content:string;isCorrect:boolean}[]; explanation?:string; isPreviousYear?:boolean; }

const MCQS: Q[] = [

// ─── DATABASE MANAGEMENT SYSTEM (15) ─────────────────────────────────────────
{ topicId:T.DBMS, difficulty:'EASY', isPreviousYear:true,
  question:'Which key uniquely identifies each record in a table?',
  options:[{content:'Primary Key',isCorrect:true},{content:'Foreign Key',isCorrect:false},{content:'Candidate Key',isCorrect:false},{content:'Super Key',isCorrect:false}],
  explanation:'A primary key uniquely identifies each row in a table and cannot be NULL or duplicate.' },

{ topicId:T.DBMS, difficulty:'EASY', isPreviousYear:false,
  question:'ACID properties in DBMS stand for:',
  options:[{content:'Atomicity, Consistency, Isolation, Durability',isCorrect:true},{content:'Accuracy, Consistency, Integrity, Durability',isCorrect:false},{content:'Atomicity, Correctness, Isolation, Data',isCorrect:false},{content:'Access, Control, Integrity, Data',isCorrect:false}],
  explanation:'ACID ensures reliable database transactions: Atomicity (all or nothing), Consistency (valid state), Isolation (concurrent), Durability (permanent).' },

{ topicId:T.DBMS, difficulty:'EASY', isPreviousYear:true,
  question:'An ER diagram represents:',
  options:[{content:'The logical structure of a database using entities and relationships',isCorrect:true},{content:'The physical storage of data on disk',isCorrect:false},{content:'The network topology of a system',isCorrect:false},{content:'The program flow of an application',isCorrect:false}],
  explanation:'Entity-Relationship (ER) diagrams model the database schema showing entities, attributes, and their relationships.' },

{ topicId:T.DBMS, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Which normal form eliminates transitive dependencies?',
  options:[{content:'Third Normal Form (3NF)',isCorrect:true},{content:'First Normal Form (1NF)',isCorrect:false},{content:'Second Normal Form (2NF)',isCorrect:false},{content:'Boyce-Codd Normal Form (BCNF)',isCorrect:false}],
  explanation:'3NF: no transitive dependency (non-key attribute depending on another non-key attribute). 2NF removes partial dependencies.' },

{ topicId:T.DBMS, difficulty:'MEDIUM', isPreviousYear:false,
  question:'A foreign key in a table:',
  options:[{content:'References the primary key of another table',isCorrect:true},{content:'Is always the primary key',isCorrect:false},{content:'Must be unique in its table',isCorrect:false},{content:'Cannot contain NULL values',isCorrect:false}],
  explanation:'A foreign key creates a referential link to a primary key in another (or the same) table, enforcing referential integrity.' },

{ topicId:T.DBMS, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Which of the following is a DDL (Data Definition Language) command?',
  options:[{content:'CREATE',isCorrect:true},{content:'SELECT',isCorrect:false},{content:'INSERT',isCorrect:false},{content:'UPDATE',isCorrect:false}],
  explanation:'DDL commands define structure: CREATE, ALTER, DROP, TRUNCATE. DML manipulates data: SELECT, INSERT, UPDATE, DELETE.' },

{ topicId:T.DBMS, difficulty:'MEDIUM', isPreviousYear:false,
  question:'In 1NF (First Normal Form), a table must:',
  options:[{content:'Have atomic (indivisible) values in each column with no repeating groups',isCorrect:true},{content:'Have no NULL values',isCorrect:false},{content:'Eliminate all redundant data',isCorrect:false},{content:'Have exactly one primary key per table',isCorrect:false}],
  explanation:'1NF requires atomic values in each cell, no repeating groups, and each row uniquely identifiable.' },

{ topicId:T.DBMS, difficulty:'HARD', isPreviousYear:true,
  question:'Which type of join returns all records from both tables including non-matching rows?',
  options:[{content:'FULL OUTER JOIN',isCorrect:true},{content:'INNER JOIN',isCorrect:false},{content:'LEFT JOIN',isCorrect:false},{content:'CROSS JOIN',isCorrect:false}],
  explanation:'FULL OUTER JOIN returns all rows from both tables; non-matching rows get NULL values for the other table\'s columns.' },

{ topicId:T.DBMS, difficulty:'HARD', isPreviousYear:false,
  question:'What is a deadlock in DBMS?',
  options:[{content:'Two or more transactions waiting indefinitely for each other to release locks',isCorrect:true},{content:'A transaction that takes too long to complete',isCorrect:false},{content:'A database that runs out of storage space',isCorrect:false},{content:'A query that returns no results',isCorrect:false}],
  explanation:'Deadlock: T1 holds lock A, waits for B; T2 holds B, waits for A. Neither can proceed — circular wait.' },

{ topicId:T.DBMS, difficulty:'HARD', isPreviousYear:true,
  question:'The BCNF (Boyce-Codd Normal Form) condition is:',
  options:[{content:'For every functional dependency X→Y, X must be a superkey',isCorrect:true},{content:'No partial dependencies',isCorrect:false},{content:'No transitive dependencies',isCorrect:false},{content:'All attributes must depend on the primary key',isCorrect:false}],
  explanation:'BCNF: for every non-trivial FD X→Y, X must be a superkey. Stricter than 3NF.' },

{ topicId:T.DBMS, difficulty:'HARD', isPreviousYear:false,
  question:'Which concurrency control technique uses timestamps to order transactions?',
  options:[{content:'Timestamp-based protocol',isCorrect:true},{content:'Two-phase locking (2PL)',isCorrect:false},{content:'Optimistic concurrency control',isCorrect:false},{content:'MVCC',isCorrect:false}],
  explanation:'Timestamp-based protocol assigns each transaction a unique timestamp and ensures execution order based on timestamps.' },

{ topicId:T.DBMS, difficulty:'EXPERT', isPreviousYear:true,
  question:'If a relation R(A,B,C,D) has FDs: A→B, B→C, C→D. What is the closure of {A}?',
  options:[{content:'{A, B, C, D}',isCorrect:true},{content:'{A, B}',isCorrect:false},{content:'{A, B, C}',isCorrect:false},{content:'{A}',isCorrect:false}],
  explanation:'A+ = {A} → A→B: add B → {A,B} → B→C: add C → {A,B,C} → C→D: add D → {A,B,C,D}.' },

{ topicId:T.DBMS, difficulty:'EXPERT', isPreviousYear:false,
  question:'What is a phantom read in database transactions?',
  options:[{content:'A transaction reads newly inserted rows in a re-execution of the same query',isCorrect:true},{content:'Reading a value that was never committed',isCorrect:false},{content:'Reading an updated value before commit',isCorrect:false},{content:'A deleted row appearing in results',isCorrect:false}],
  explanation:'Phantom read: T1 re-executes a range query and sees new rows inserted by T2 that committed in between.' },

{ topicId:T.DBMS, difficulty:'EASY', isPreviousYear:false,
  question:'Which of the following SQL command permanently saves a transaction?',
  options:[{content:'COMMIT',isCorrect:true},{content:'ROLLBACK',isCorrect:false},{content:'SAVEPOINT',isCorrect:false},{content:'BEGIN',isCorrect:false}],
  explanation:'COMMIT makes all changes in a transaction permanent. ROLLBACK undoes changes to the last COMMIT or SAVEPOINT.' },

{ topicId:T.DBMS, difficulty:'MEDIUM', isPreviousYear:true,
  question:'An index in a database is used to:',
  options:[{content:'Speed up data retrieval operations',isCorrect:true},{content:'Enforce data integrity',isCorrect:false},{content:'Create table relationships',isCorrect:false},{content:'Backup data automatically',isCorrect:false}],
  explanation:'Indexes create data structures (B-trees etc.) that allow faster lookup without scanning every row.' },

// ─── NUMBER SYSTEMS (topic NUMS - 15 questions) ───────────────────────────────
{ topicId:T.NUMS, difficulty:'EASY', isPreviousYear:true,
  question:'Convert binary 11001 to decimal:',
  options:[{content:'25',isCorrect:true},{content:'24',isCorrect:false},{content:'26',isCorrect:false},{content:'19',isCorrect:false}],
  explanation:'11001 = 1×16 + 1×8 + 0×4 + 0×2 + 1×1 = 16+8+0+0+1 = 25.' },

{ topicId:T.NUMS, difficulty:'EASY', isPreviousYear:false,
  question:'What is the octal equivalent of decimal 64?',
  options:[{content:'100',isCorrect:true},{content:'80',isCorrect:false},{content:'64',isCorrect:false},{content:'40',isCorrect:false}],
  explanation:'64 ÷ 8 = 8 remainder 0. 8 ÷ 8 = 1 remainder 0. 1 ÷ 8 = 0 remainder 1. Read remainders bottom-up: 100₈.' },

{ topicId:T.NUMS, difficulty:'EASY', isPreviousYear:true,
  question:'Binary addition: 1 + 1 = ?',
  options:[{content:'10 (with carry 1)',isCorrect:true},{content:'2',isCorrect:false},{content:'11',isCorrect:false},{content:'0',isCorrect:false}],
  explanation:'In binary: 1+1 = 10 (write 0, carry 1). This is equivalent to decimal 2.' },

{ topicId:T.NUMS, difficulty:'MEDIUM', isPreviousYear:false,
  question:'The decimal number 0.625 in binary is:',
  options:[{content:'0.101',isCorrect:true},{content:'0.011',isCorrect:false},{content:'0.110',isCorrect:false},{content:'0.111',isCorrect:false}],
  explanation:'0.625×2=1.25→1; 0.25×2=0.5→0; 0.5×2=1.0→1. Binary: 0.101.' },

{ topicId:T.NUMS, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Convert hexadecimal 2B to binary:',
  options:[{content:'00101011',isCorrect:true},{content:'00111011',isCorrect:false},{content:'00101101',isCorrect:false},{content:'00100111',isCorrect:false}],
  explanation:'2=0010, B=11=1011. Concatenate: 0010 1011 = 00101011.' },

{ topicId:T.NUMS, difficulty:'MEDIUM', isPreviousYear:false,
  question:'The 2\'s complement representation is used in computers primarily to:',
  options:[{content:'Simplify subtraction by turning it into addition',isCorrect:true},{content:'Increase the range of positive numbers',isCorrect:false},{content:'Store floating point numbers',isCorrect:false},{content:'Represent fractions accurately',isCorrect:false}],
  explanation:'2\'s complement allows subtraction using the same addition circuitry: A - B = A + (-B) = A + (2\'s complement of B).' },

{ topicId:T.NUMS, difficulty:'MEDIUM', isPreviousYear:true,
  question:'What is the result of binary multiplication: 101 × 11?',
  options:[{content:'1111',isCorrect:true},{content:'1100',isCorrect:false},{content:'1010',isCorrect:false},{content:'10011',isCorrect:false}],
  explanation:'101 × 11: 101×1=101; 101×10=1010. Sum: 101+1010=1111. (5×3=15=1111₂).' },

{ topicId:T.NUMS, difficulty:'HARD', isPreviousYear:true,
  question:'How many digits are needed to represent decimal 256 in hexadecimal?',
  options:[{content:'3',isCorrect:true},{content:'2',isCorrect:false},{content:'4',isCorrect:false},{content:'8',isCorrect:false}],
  explanation:'256 in hex: 256/16=16 R0; 16/16=1 R0; 1/16=0 R1. → 100₁₆. Three digits.' },

{ topicId:T.NUMS, difficulty:'HARD', isPreviousYear:false,
  question:'The excess-3 code for decimal 5 is:',
  options:[{content:'1000',isCorrect:true},{content:'0101',isCorrect:false},{content:'1001',isCorrect:false},{content:'0110',isCorrect:false}],
  explanation:'Excess-3 = BCD + 3. Decimal 5 in BCD = 0101. 0101 + 0011 = 1000.' },

{ topicId:T.NUMS, difficulty:'HARD', isPreviousYear:true,
  question:'In signed magnitude representation, +0 and -0 are:',
  options:[{content:'Two distinct representations',isCorrect:true},{content:'The same representation',isCorrect:false},{content:'Both represented as 0000',isCorrect:false},{content:'Not possible to represent',isCorrect:false}],
  explanation:'Signed magnitude: +0 = 00000000, -0 = 10000000. Two different bit patterns for zero — a disadvantage.' },

{ topicId:T.NUMS, difficulty:'HARD', isPreviousYear:false,
  question:'Binary subtraction 1010 - 0110 using 2\'s complement:',
  options:[{content:'0100',isCorrect:true},{content:'0011',isCorrect:false},{content:'0101',isCorrect:false},{content:'1100',isCorrect:false}],
  explanation:'2\'s complement of 0110: flip→1001, add 1→1010. Then 1010+1010=10100; ignore carry → 0100. (10-6=4).' },

{ topicId:T.NUMS, difficulty:'EXPERT', isPreviousYear:true,
  question:'Unicode uses how many bits in UTF-32 encoding per character?',
  options:[{content:'32 bits',isCorrect:true},{content:'8 bits',isCorrect:false},{content:'16 bits',isCorrect:false},{content:'Variable (1-4 bytes)',isCorrect:false}],
  explanation:'UTF-32 uses exactly 32 bits (4 bytes) per character. UTF-8 is variable (1-4 bytes); UTF-16 is 2 or 4 bytes.' },

{ topicId:T.NUMS, difficulty:'EXPERT', isPreviousYear:false,
  question:'The range of an 8-bit unsigned integer is:',
  options:[{content:'0 to 255',isCorrect:true},{content:'-128 to 127',isCorrect:false},{content:'0 to 256',isCorrect:false},{content:'-127 to 127',isCorrect:false}],
  explanation:'Unsigned 8-bit: 0 to 2^8-1 = 0 to 255. Signed 8-bit 2\'s complement: -128 to +127.' },

{ topicId:T.NUMS, difficulty:'EASY', isPreviousYear:false,
  question:'Hexadecimal 1A in decimal is:',
  options:[{content:'26',isCorrect:true},{content:'20',isCorrect:false},{content:'16',isCorrect:false},{content:'32',isCorrect:false}],
  explanation:'1A₁₆ = 1×16 + 10 = 16 + 10 = 26.' },

{ topicId:T.NUMS, difficulty:'MEDIUM', isPreviousYear:true,
  question:'A nibble consists of how many bits?',
  options:[{content:'4',isCorrect:true},{content:'8',isCorrect:false},{content:'16',isCorrect:false},{content:'2',isCorrect:false}],
  explanation:'1 nibble = 4 bits = half a byte. Two nibbles make one byte.' },

// ─── INTERNET & WEB TECHNOLOGIES (15) ────────────────────────────────────────
{ topicId:T.WEB, difficulty:'EASY', isPreviousYear:true,
  question:'HTTP stands for:',
  options:[{content:'HyperText Transfer Protocol',isCorrect:true},{content:'High Transfer Text Protocol',isCorrect:false},{content:'HyperText Terminal Protocol',isCorrect:false},{content:'Hyperlink Text Transfer Protocol',isCorrect:false}],
  explanation:'HTTP (HyperText Transfer Protocol) is the foundation of data communication on the World Wide Web.' },

{ topicId:T.WEB, difficulty:'EASY', isPreviousYear:false,
  question:'HTML is used to:',
  options:[{content:'Structure and present content on web pages',isCorrect:true},{content:'Style web page elements',isCorrect:false},{content:'Add interactivity to web pages',isCorrect:false},{content:'Manage server-side databases',isCorrect:false}],
  explanation:'HTML (HyperText Markup Language) defines the structure and semantic meaning of web content using tags.' },

{ topicId:T.WEB, difficulty:'EASY', isPreviousYear:true,
  question:'Which protocol is used to send emails?',
  options:[{content:'SMTP',isCorrect:true},{content:'FTP',isCorrect:false},{content:'HTTP',isCorrect:false},{content:'POP3',isCorrect:false}],
  explanation:'SMTP (Simple Mail Transfer Protocol) is used to send emails. POP3 and IMAP are used to receive emails.' },

{ topicId:T.WEB, difficulty:'MEDIUM', isPreviousYear:true,
  question:'A URL (Uniform Resource Locator) consists of:',
  options:[{content:'Protocol, domain name, path, and optionally query parameters',isCorrect:true},{content:'IP address and port number only',isCorrect:false},{content:'Domain name and file extension only',isCorrect:false},{content:'Protocol and IP address only',isCorrect:false}],
  explanation:'URL structure: protocol://domain:port/path?query#fragment (e.g., https://example.com/page?id=1).' },

{ topicId:T.WEB, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Which HTTP method is used to submit form data to a server?',
  options:[{content:'POST',isCorrect:true},{content:'GET',isCorrect:false},{content:'PUT',isCorrect:false},{content:'DELETE',isCorrect:false}],
  explanation:'POST sends data in the request body (secure, for forms). GET appends data to the URL (visible, for queries).' },

{ topicId:T.WEB, difficulty:'MEDIUM', isPreviousYear:true,
  question:'CSS is used for:',
  options:[{content:'Styling and presentation of HTML elements',isCorrect:true},{content:'Creating database queries',isCorrect:false},{content:'Server-side programming',isCorrect:false},{content:'Network configuration',isCorrect:false}],
  explanation:'CSS (Cascading Style Sheets) controls visual presentation: colors, fonts, layout, and responsive design.' },

{ topicId:T.WEB, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Which port does HTTP use by default?',
  options:[{content:'80',isCorrect:true},{content:'443',isCorrect:false},{content:'21',isCorrect:false},{content:'25',isCorrect:false}],
  explanation:'HTTP uses port 80 by default. HTTPS uses 443, FTP uses 21, SMTP uses 25.' },

{ topicId:T.WEB, difficulty:'HARD', isPreviousYear:true,
  question:'What is a cookie in web technology?',
  options:[{content:'Small data stored by the browser to remember user information',isCorrect:true},{content:'A type of web server malware',isCorrect:false},{content:'A program running on the web server',isCorrect:false},{content:'A web browser plugin',isCorrect:false}],
  explanation:'Cookies are small text files stored client-side that help websites remember login state, preferences, etc.' },

{ topicId:T.WEB, difficulty:'HARD', isPreviousYear:false,
  question:'REST API uses which protocol as its basis?',
  options:[{content:'HTTP',isCorrect:true},{content:'FTP',isCorrect:false},{content:'SOAP',isCorrect:false},{content:'SMTP',isCorrect:false}],
  explanation:'REST (Representational State Transfer) APIs use HTTP methods (GET, POST, PUT, DELETE) to perform CRUD operations.' },

{ topicId:T.WEB, difficulty:'HARD', isPreviousYear:true,
  question:'Which HTML tag is used to create a hyperlink?',
  options:[{content:'<a href="">',isCorrect:true},{content:'<link>',isCorrect:false},{content:'<url>',isCorrect:false},{content:'<href>',isCorrect:false}],
  explanation:'The <a> (anchor) tag with the href attribute creates hyperlinks to other pages, files, or locations.' },

{ topicId:T.WEB, difficulty:'HARD', isPreviousYear:false,
  question:'What does DNS caching improve?',
  options:[{content:'Speed of domain name resolution by storing recent query results',isCorrect:true},{content:'Security of HTTPS connections',isCorrect:false},{content:'Compression of web page data',isCorrect:false},{content:'Encryption of email',isCorrect:false}],
  explanation:'DNS caching stores previously resolved domain-to-IP mappings locally, reducing lookup time for repeated requests.' },

{ topicId:T.WEB, difficulty:'EXPERT', isPreviousYear:true,
  question:'In a stateless protocol like HTTP, session management is achieved using:',
  options:[{content:'Cookies, session tokens, or URL parameters',isCorrect:true},{content:'Permanent TCP connections',isCorrect:false},{content:'IP address tracking only',isCorrect:false},{content:'The HTTP GET method',isCorrect:false}],
  explanation:'HTTP is stateless — each request is independent. Sessions are simulated using cookies or session IDs passed in requests.' },

{ topicId:T.WEB, difficulty:'EXPERT', isPreviousYear:false,
  question:'Which of the following is a JavaScript framework used for building user interfaces?',
  options:[{content:'React',isCorrect:true},{content:'Django',isCorrect:false},{content:'Flask',isCorrect:false},{content:'Laravel',isCorrect:false}],
  explanation:'React (by Meta) is a JavaScript library for building UI components. Django and Flask are Python web frameworks; Laravel is PHP.' },

{ topicId:T.WEB, difficulty:'EASY', isPreviousYear:false,
  question:'FTP is used to:',
  options:[{content:'Transfer files between computers over a network',isCorrect:true},{content:'Browse websites',isCorrect:false},{content:'Send emails',isCorrect:false},{content:'Stream video',isCorrect:false}],
  explanation:'FTP (File Transfer Protocol) transfers files between a client and server over TCP/IP networks.' },

{ topicId:T.WEB, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Which of the following is NOT a web browser?',
  options:[{content:'Apache',isCorrect:true},{content:'Chrome',isCorrect:false},{content:'Firefox',isCorrect:false},{content:'Safari',isCorrect:false}],
  explanation:'Apache is a web server, not a browser. Chrome, Firefox, and Safari are web browsers.' },

// ─── MEMORY ORGANIZATION (15) ────────────────────────────────────────────────
{ topicId:T.MEM, difficulty:'EASY', isPreviousYear:true,
  question:'Which memory is fastest in the memory hierarchy?',
  options:[{content:'CPU Registers',isCorrect:true},{content:'Cache Memory',isCorrect:false},{content:'RAM',isCorrect:false},{content:'Hard Disk',isCorrect:false}],
  explanation:'CPU registers are the fastest memory (built into the processor), but have very small capacity.' },

{ topicId:T.MEM, difficulty:'EASY', isPreviousYear:false,
  question:'DRAM stands for:',
  options:[{content:'Dynamic Random Access Memory',isCorrect:true},{content:'Direct Random Access Memory',isCorrect:false},{content:'Dual Random Access Memory',isCorrect:false},{content:'Dynamic Read-only Access Memory',isCorrect:false}],
  explanation:'DRAM uses capacitors that need periodic refreshing. Cheaper and denser but slower than SRAM.' },

{ topicId:T.MEM, difficulty:'EASY', isPreviousYear:true,
  question:'Which type of ROM can be erased using ultraviolet light?',
  options:[{content:'EPROM',isCorrect:true},{content:'EEPROM',isCorrect:false},{content:'PROM',isCorrect:false},{content:'Flash Memory',isCorrect:false}],
  explanation:'EPROM (Erasable Programmable ROM) is erased by exposing it to ultraviolet light through a quartz window.' },

{ topicId:T.MEM, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Virtual memory allows a computer to:',
  options:[{content:'Use disk space as an extension of RAM',isCorrect:true},{content:'Access memory faster',isCorrect:false},{content:'Run programs without any RAM',isCorrect:false},{content:'Share memory between users on a network',isCorrect:false}],
  explanation:'Virtual memory uses a portion of the hard disk as additional RAM, allowing programs larger than physical RAM to run.' },

{ topicId:T.MEM, difficulty:'MEDIUM', isPreviousYear:false,
  question:'What is the purpose of cache memory?',
  options:[{content:'Bridge the speed gap between fast CPU and slower RAM',isCorrect:true},{content:'Store permanent data',isCorrect:false},{content:'Replace RAM entirely',isCorrect:false},{content:'Provide backup storage',isCorrect:false}],
  explanation:'Cache stores frequently accessed data/instructions closer to the CPU, reducing average memory access time.' },

{ topicId:T.MEM, difficulty:'MEDIUM', isPreviousYear:true,
  question:'A page fault occurs when:',
  options:[{content:'The requested page is not in physical memory and must be loaded from disk',isCorrect:true},{content:'A page is corrupted in memory',isCorrect:false},{content:'The cache is full',isCorrect:false},{content:'A program accesses a wrong variable',isCorrect:false}],
  explanation:'Page fault: the CPU references a page not currently in RAM. OS loads it from swap space (disk) — called page swapping.' },

{ topicId:T.MEM, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Associative memory (Content-Addressable Memory) searches by:',
  options:[{content:'Content rather than address',isCorrect:true},{content:'Address only',isCorrect:false},{content:'Sequential scanning',isCorrect:false},{content:'Random selection',isCorrect:false}],
  explanation:'CAM (Content-Addressable Memory) searches all locations simultaneously based on data content, used in caches and TLBs.' },

{ topicId:T.MEM, difficulty:'HARD', isPreviousYear:true,
  question:'The LRU (Least Recently Used) page replacement algorithm replaces:',
  options:[{content:'The page that has not been used for the longest time',isCorrect:true},{content:'The page that has been used most recently',isCorrect:false},{content:'The page that was loaded first',isCorrect:false},{content:'A randomly selected page',isCorrect:false}],
  explanation:'LRU evicts the page that was accessed least recently, based on the principle of temporal locality.' },

{ topicId:T.MEM, difficulty:'HARD', isPreviousYear:false,
  question:'Thrashing in virtual memory occurs when:',
  options:[{content:'The system spends more time swapping pages than executing instructions',isCorrect:true},{content:'Cache becomes full',isCorrect:false},{content:'RAM fails physically',isCorrect:false},{content:'Disk seeks too frequently',isCorrect:false}],
  explanation:'Thrashing: too many processes competing for too little RAM, causing constant page faults and excessive I/O.' },

{ topicId:T.MEM, difficulty:'HARD', isPreviousYear:true,
  question:'A TLB (Translation Lookaside Buffer) is used to:',
  options:[{content:'Speed up virtual-to-physical address translation',isCorrect:true},{content:'Cache frequently accessed disk blocks',isCorrect:false},{content:'Translate programming language code',isCorrect:false},{content:'Store page tables entirely',isCorrect:false}],
  explanation:'TLB is a fast cache for page table entries, avoiding repeated slow page table lookups in main memory.' },

{ topicId:T.MEM, difficulty:'HARD', isPreviousYear:false,
  question:'ECC (Error Correcting Code) memory can:',
  options:[{content:'Detect and correct single-bit errors automatically',isCorrect:true},{content:'Double the speed of RAM',isCorrect:false},{content:'Prevent all memory failures',isCorrect:false},{content:'Only detect errors, not correct them',isCorrect:false}],
  explanation:'ECC memory detects and auto-corrects single-bit errors using Hamming code; it can detect (but not correct) double-bit errors.' },

{ topicId:T.MEM, difficulty:'EXPERT', isPreviousYear:true,
  question:'In a 4-way set-associative cache with 64 sets and 64-byte blocks, the total cache size is:',
  options:[{content:'16 KB',isCorrect:true},{content:'8 KB',isCorrect:false},{content:'32 KB',isCorrect:false},{content:'4 KB',isCorrect:false}],
  explanation:'Cache size = ways × sets × block_size = 4 × 64 × 64 = 16,384 bytes = 16 KB.' },

{ topicId:T.MEM, difficulty:'EXPERT', isPreviousYear:false,
  question:'If a process has 8 pages and a frame allocation of 4, the optimal page fault count with sequence 1,2,3,4,1,2,5,1,2,3,4,5 is:',
  options:[{content:'6',isCorrect:true},{content:'8',isCorrect:false},{content:'4',isCorrect:false},{content:'10',isCorrect:false}],
  explanation:'Optimal replacement algorithm (Belady\'s): replace the page that will not be used for the longest time. Results in 6 page faults for this sequence.' },

{ topicId:T.MEM, difficulty:'EASY', isPreviousYear:false,
  question:'Flash memory is a type of:',
  options:[{content:'EEPROM that can be erased and programmed electrically in blocks',isCorrect:true},{content:'Volatile RAM',isCorrect:false},{content:'Read-only optical storage',isCorrect:false},{content:'Sequential access storage',isCorrect:false}],
  explanation:'Flash memory is a form of EEPROM that is non-volatile, uses block-level erasure, and is used in SSDs, USB drives, etc.' },

{ topicId:T.MEM, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Demand paging loads a page into memory:',
  options:[{content:'Only when it is needed (referenced)',isCorrect:true},{content:'All pages at program start',isCorrect:false},{content:'Based on prediction algorithms',isCorrect:false},{content:'When free frames are available',isCorrect:false}],
  explanation:'Demand paging is a lazy loading strategy: pages are loaded only when the CPU references them (causing a page fault).' },

// ─── OBJECT-ORIENTED PROGRAMMING (15) ────────────────────────────────────────
{ topicId:T.OOP, difficulty:'EASY', isPreviousYear:true,
  question:'Which OOP concept bundles data and methods that operate on data within one unit?',
  options:[{content:'Encapsulation',isCorrect:true},{content:'Inheritance',isCorrect:false},{content:'Polymorphism',isCorrect:false},{content:'Abstraction',isCorrect:false}],
  explanation:'Encapsulation wraps data (attributes) and methods into a single unit (class) and restricts direct access.' },

{ topicId:T.OOP, difficulty:'EASY', isPreviousYear:false,
  question:'Which OOP concept allows a class to inherit properties from another class?',
  options:[{content:'Inheritance',isCorrect:true},{content:'Encapsulation',isCorrect:false},{content:'Polymorphism',isCorrect:false},{content:'Overloading',isCorrect:false}],
  explanation:'Inheritance enables a child class to acquire attributes and methods from a parent class, promoting code reuse.' },

{ topicId:T.OOP, difficulty:'EASY', isPreviousYear:true,
  question:'A constructor in OOP is:',
  options:[{content:'A special method called automatically when an object is created',isCorrect:true},{content:'A method that destroys objects',isCorrect:false},{content:'A method that returns a value',isCorrect:false},{content:'A static class method',isCorrect:false}],
  explanation:'Constructor initializes a newly created object; it has the same name as the class and no return type.' },

{ topicId:T.OOP, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Method overriding in OOP means:',
  options:[{content:'A subclass provides a specific implementation of a method defined in its superclass',isCorrect:true},{content:'Defining multiple methods with the same name but different parameters',isCorrect:false},{content:'Preventing a method from being inherited',isCorrect:false},{content:'Calling a superclass method from a subclass',isCorrect:false}],
  explanation:'Overriding: subclass redefines a superclass method with the same signature — enables runtime polymorphism.' },

{ topicId:T.OOP, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Method overloading is:',
  options:[{content:'Same method name with different parameter lists in the same class',isCorrect:true},{content:'Redefining a parent class method in a child class',isCorrect:false},{content:'Calling a method from multiple classes',isCorrect:false},{content:'Preventing method inheritance',isCorrect:false}],
  explanation:'Overloading = compile-time polymorphism: same name, different signatures (parameter count/types).' },

{ topicId:T.OOP, difficulty:'MEDIUM', isPreviousYear:true,
  question:'An abstract class in OOP:',
  options:[{content:'Cannot be instantiated and may have abstract methods',isCorrect:true},{content:'Has no methods',isCorrect:false},{content:'Can only have private members',isCorrect:false},{content:'Is the same as an interface',isCorrect:false}],
  explanation:'An abstract class provides a template; it cannot be instantiated directly and may contain abstract methods that subclasses must implement.' },

{ topicId:T.OOP, difficulty:'MEDIUM', isPreviousYear:false,
  question:'In C++, what is a virtual function?',
  options:[{content:'A function that supports runtime polymorphism through dynamic dispatch',isCorrect:true},{content:'A function that exists only in memory',isCorrect:false},{content:'A function with no implementation',isCorrect:false},{content:'A function declared in multiple classes',isCorrect:false}],
  explanation:'Virtual functions use a vtable (virtual function table) for dynamic dispatch, allowing derived class methods to be called through base class pointers.' },

{ topicId:T.OOP, difficulty:'HARD', isPreviousYear:true,
  question:'Which relationship is described as "HAS-A" in OOP?',
  options:[{content:'Composition/Aggregation',isCorrect:true},{content:'Inheritance',isCorrect:false},{content:'Polymorphism',isCorrect:false},{content:'Abstraction',isCorrect:false}],
  explanation:'HAS-A = composition (Car HAS-A Engine). IS-A = inheritance (Dog IS-A Animal). These are different OOP relationships.' },

{ topicId:T.OOP, difficulty:'HARD', isPreviousYear:false,
  question:'Multiple inheritance means:',
  options:[{content:'A class inherits from more than one parent class',isCorrect:true},{content:'Creating multiple objects of the same class',isCorrect:false},{content:'Inheriting in multiple levels',isCorrect:false},{content:'A class with multiple constructors',isCorrect:false}],
  explanation:'Multiple inheritance: class C inherits from both A and B. Java avoids this with interfaces; C++ supports it.' },

{ topicId:T.OOP, difficulty:'HARD', isPreviousYear:true,
  question:'The "diamond problem" in multiple inheritance occurs when:',
  options:[{content:'Two parent classes inherit from a common base, causing ambiguity in the grandchild',isCorrect:true},{content:'A class has too many methods',isCorrect:false},{content:'An object is instantiated multiple times',isCorrect:false},{content:'Two classes have the same name',isCorrect:false}],
  explanation:'Diamond problem: D inherits from B and C, both inheriting from A. Which version of A\'s method should D use?' },

{ topicId:T.OOP, difficulty:'HARD', isPreviousYear:false,
  question:'What does the "private" access specifier ensure in OOP?',
  options:[{content:'Members are accessible only within the same class',isCorrect:true},{content:'Members are accessible by all classes',isCorrect:false},{content:'Members are accessible by subclasses only',isCorrect:false},{content:'Members cannot be changed at runtime',isCorrect:false}],
  explanation:'Private members are accessible only within the declaring class — hidden from subclasses and other classes.' },

{ topicId:T.OOP, difficulty:'EXPERT', isPreviousYear:true,
  question:'A pure virtual function in C++ is declared as:',
  options:[{content:'virtual void func() = 0;',isCorrect:true},{content:'virtual void func();',isCorrect:false},{content:'void pure func();',isCorrect:false},{content:'abstract void func();',isCorrect:false}],
  explanation:'= 0 makes it pure virtual, forcing derived classes to implement it. A class with any pure virtual function is abstract.' },

{ topicId:T.OOP, difficulty:'EXPERT', isPreviousYear:false,
  question:'Design pattern "Singleton" ensures:',
  options:[{content:'Only one instance of a class exists throughout the application',isCorrect:true},{content:'A class can only be subclassed once',isCorrect:false},{content:'All methods are static',isCorrect:false},{content:'Objects are created in a factory',isCorrect:false}],
  explanation:'Singleton pattern restricts instantiation to one object, providing a global access point (e.g., database connections, loggers).' },

{ topicId:T.OOP, difficulty:'EASY', isPreviousYear:false,
  question:'Which OOP principle hides internal implementation details and shows only functionality?',
  options:[{content:'Abstraction',isCorrect:true},{content:'Encapsulation',isCorrect:false},{content:'Inheritance',isCorrect:false},{content:'Overloading',isCorrect:false}],
  explanation:'Abstraction shows essential features and hides complexity (e.g., you use a car without knowing engine internals).' },

{ topicId:T.OOP, difficulty:'MEDIUM', isPreviousYear:true,
  question:'In Java, all classes implicitly extend which class?',
  options:[{content:'Object',isCorrect:true},{content:'Main',isCorrect:false},{content:'Super',isCorrect:false},{content:'Base',isCorrect:false}],
  explanation:'In Java, every class implicitly inherits from java.lang.Object, which provides methods like toString(), equals(), hashCode().' },

// ─── OPERATING SYSTEM (15) ───────────────────────────────────────────────────
{ topicId:T.OS, difficulty:'EASY', isPreviousYear:true,
  question:'A process in OS is:',
  options:[{content:'A program in execution',isCorrect:true},{content:'A stored program on disk',isCorrect:false},{content:'A hardware component',isCorrect:false},{content:'An OS command',isCorrect:false}],
  explanation:'A process is a program loaded into memory and actively being executed, with its own memory space, PC, and state.' },

{ topicId:T.OS, difficulty:'EASY', isPreviousYear:false,
  question:'Which scheduling algorithm gives priority to the shortest job first?',
  options:[{content:'SJF (Shortest Job First)',isCorrect:true},{content:'FCFS (First Come First Served)',isCorrect:false},{content:'Round Robin',isCorrect:false},{content:'Priority Scheduling',isCorrect:false}],
  explanation:'SJF selects the process with the smallest burst time next. It is optimal in minimizing average waiting time.' },

{ topicId:T.OS, difficulty:'EASY', isPreviousYear:true,
  question:'Which of the following is NOT a state of a process?',
  options:[{content:'Compiling',isCorrect:true},{content:'Running',isCorrect:false},{content:'Waiting',isCorrect:false},{content:'Ready',isCorrect:false}],
  explanation:'Process states: New, Ready, Running, Waiting/Blocked, Terminated. "Compiling" is not a process state.' },

{ topicId:T.OS, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Deadlock can occur only if all four Coffman conditions hold simultaneously. Which is NOT one of them?',
  options:[{content:'Preemption (resources can be forcibly taken)',isCorrect:true},{content:'Mutual Exclusion',isCorrect:false},{content:'Hold and Wait',isCorrect:false},{content:'Circular Wait',isCorrect:false}],
  explanation:'Coffman conditions: Mutual Exclusion, Hold & Wait, NO Preemption, Circular Wait. Preemption PREVENTS deadlock.' },

{ topicId:T.OS, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Round Robin scheduling uses:',
  options:[{content:'A fixed time quantum given to each process in turn',isCorrect:true},{content:'Priority values assigned to processes',isCorrect:false},{content:'Shortest burst time first',isCorrect:false},{content:'First-come first-served order only',isCorrect:false}],
  explanation:'Round Robin: each process gets a fixed time slice (quantum); after expiry, it goes to the back of the queue.' },

{ topicId:T.OS, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Semaphore in OS is used for:',
  options:[{content:'Process synchronization and mutual exclusion',isCorrect:true},{content:'Memory allocation',isCorrect:false},{content:'CPU scheduling',isCorrect:false},{content:'File management',isCorrect:false}],
  explanation:'Semaphores (Dijkstra) are integer variables with wait() and signal() operations used to control access to shared resources.' },

{ topicId:T.OS, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Context switching refers to:',
  options:[{content:'Saving and restoring CPU state when switching between processes',isCorrect:true},{content:'Switching between user and kernel mode',isCorrect:false},{content:'Changing the active network connection',isCorrect:false},{content:'Moving a process from RAM to disk',isCorrect:false}],
  explanation:'Context switch: OS saves the current process\'s state (registers, PC) and loads the next process\'s saved state.' },

{ topicId:T.OS, difficulty:'HARD', isPreviousYear:true,
  question:'The Banker\'s algorithm is used for:',
  options:[{content:'Deadlock avoidance by checking safe state before resource allocation',isCorrect:true},{content:'Memory management',isCorrect:false},{content:'CPU scheduling',isCorrect:false},{content:'Deadlock detection after it occurs',isCorrect:false}],
  explanation:'Banker\'s algorithm (Dijkstra) avoids deadlock by checking if granting a resource request leaves the system in a safe state.' },

{ topicId:T.OS, difficulty:'HARD', isPreviousYear:false,
  question:'Thrashing is related to which OS concept?',
  options:[{content:'Virtual memory and excessive paging',isCorrect:true},{content:'CPU scheduling starvation',isCorrect:false},{content:'Deadlock between processes',isCorrect:false},{content:'File system corruption',isCorrect:false}],
  explanation:'Thrashing: OS spends most time swapping pages in/out rather than executing processes, due to insufficient physical memory.' },

{ topicId:T.OS, difficulty:'HARD', isPreviousYear:true,
  question:'Inter-Process Communication (IPC) mechanisms include:',
  options:[{content:'Pipes, message queues, shared memory, and sockets',isCorrect:true},{content:'Only shared variables',isCorrect:false},{content:'CPU registers only',isCorrect:false},{content:'File system only',isCorrect:false}],
  explanation:'IPC mechanisms: Pipes, Named Pipes, Message Queues, Shared Memory, Semaphores, Sockets, Signals.' },

{ topicId:T.OS, difficulty:'HARD', isPreviousYear:false,
  question:'Which file allocation method provides fastest direct access?',
  options:[{content:'Indexed allocation',isCorrect:true},{content:'Contiguous allocation',isCorrect:false},{content:'Linked allocation',isCorrect:false},{content:'FAT allocation',isCorrect:false}],
  explanation:'Indexed allocation stores all block pointers in an index block, enabling direct access in O(1). Contiguous is also fast but suffers fragmentation.' },

{ topicId:T.OS, difficulty:'EXPERT', isPreviousYear:true,
  question:'In the producer-consumer problem, the shared buffer size is n. What is the maximum number of items a producer can produce before blocking?',
  options:[{content:'n',isCorrect:true},{content:'n-1',isCorrect:false},{content:'1',isCorrect:false},{content:'Unlimited',isCorrect:false}],
  explanation:'The producer can fill all n slots. When the buffer is full, it blocks until the consumer removes at least one item.' },

{ topicId:T.OS, difficulty:'EXPERT', isPreviousYear:false,
  question:'A real-time OS (RTOS) is characterized by:',
  options:[{content:'Guaranteed response within strict time constraints',isCorrect:true},{content:'Maximum CPU utilization',isCorrect:false},{content:'Maximum memory efficiency',isCorrect:false},{content:'User-friendly GUI',isCorrect:false}],
  explanation:'RTOS guarantees task completion within defined deadlines — critical for embedded systems, medical devices, industrial control.' },

{ topicId:T.OS, difficulty:'EASY', isPreviousYear:false,
  question:'Which scheduling algorithm can lead to starvation of low-priority processes?',
  options:[{content:'Priority Scheduling',isCorrect:true},{content:'Round Robin',isCorrect:false},{content:'FCFS',isCorrect:false},{content:'SJF (non-preemptive)',isCorrect:false}],
  explanation:'In Priority Scheduling, low-priority processes may wait indefinitely if high-priority processes keep arriving — called starvation.' },

{ topicId:T.OS, difficulty:'MEDIUM', isPreviousYear:true,
  question:'The purpose of a system call in OS is to:',
  options:[{content:'Allow user processes to request services from the OS kernel',isCorrect:true},{content:'Schedule CPU time among processes',isCorrect:false},{content:'Manage physical memory directly',isCorrect:false},{content:'Handle hardware interrupts',isCorrect:false}],
  explanation:'System calls provide a controlled interface between user-space programs and the OS kernel (e.g., open(), read(), fork()).' },

];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function createMCQ(q: Q): Promise<'created'|'existing'|'failed'> {
  const body = { subjectId: SUBJECT_ID, topicId: q.topicId, examIds: [EXAM_ID], questionType: 'SINGLE',
    difficulty: q.difficulty, question: q.question, options: q.options, explanation: q.explanation,
    isPreviousYear: q.isPreviousYear ?? false, isActive: true, tagIds: [], examSectionIds: [], difficultyPerExam: {} };
  try {
    const res = await fetch(`${BASE}/api/seed/mcqs`, { method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` }, body: JSON.stringify(body) });
    const json = await res.json() as { meta?: { existing?: boolean }; error?: string };
    if (!res.ok) { process.stdout.write(` [ERR: ${json.error}]`); return 'failed'; }
    return json.meta?.existing ? 'existing' : 'created';
  } catch { return 'failed'; }
}

async function main() {
  console.log(`\nPart 2 — ${MCQS.length} MCQs: DBMS, Number Systems, Internet/Web, Memory Organization, OOP, Operating System\n`);
  let created = 0, existing = 0, failed = 0;
  for (let i = 0; i < MCQS.length; i++) {
    const r = await createMCQ(MCQS[i]);
    if (r === 'created') created++; else if (r === 'existing') existing++; else failed++;
    process.stdout.write(`\r[${String(i+1).padStart(3)}/${MCQS.length}] ✅ ${created}  ⏭ ${existing}  ❌ ${failed}`);
    await sleep(120);
  }
  console.log(`\n\nDone — Created: ${created} | Existing: ${existing} | Failed: ${failed}\n`);
}
main().catch(console.error);
