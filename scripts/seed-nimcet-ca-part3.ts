export {};
/**
 * NIMCET Computer Awareness — Part 3 (topics 13–17)
 * Run: npx tsx scripts/seed-nimcet-ca-part3.ts
 */

const BASE = 'https://scholar247.org';
const KEY  = 'd846e4f1862433c8d265f459f5264b721c28a93057c9b7949d8a4cf98e7bdb9f';
const EXAM_ID    = '626534b9-0ac4-4d73-a400-7391b645338a';
const SUBJECT_ID = '14c706f0-dca1-42eb-a800-b7a04c7eb8bb';

const T = {
  OSI:    '78974422-3f73-4d76-8175-c528d285d51d',
  PROG:   'd6edead9-a268-4388-885c-c17f95dd2359',
  SORT:   '4f964521-2fe3-4277-ac59-9ac091ac4a28',
  SE:     '9b87e6d3-468f-4ef6-a665-c26c56457c74',
  SQL:    'e2c2df1c-3cc9-4a6c-886f-83a14bf65d47',
};

type D = 'EASY'|'MEDIUM'|'HARD'|'EXPERT';
interface Q { topicId:string; difficulty:D; question:string; options:{content:string;isCorrect:boolean}[]; explanation?:string; isPreviousYear?:boolean; }

const MCQS: Q[] = [

// ─── OSI & TCP/IP MODELS (15) ─────────────────────────────────────────────────
{ topicId:T.OSI, difficulty:'EASY', isPreviousYear:true,
  question:'How many layers does the OSI model have?',
  options:[{content:'7',isCorrect:true},{content:'5',isCorrect:false},{content:'4',isCorrect:false},{content:'6',isCorrect:false}],
  explanation:'OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.' },

{ topicId:T.OSI, difficulty:'EASY', isPreviousYear:false,
  question:'Which OSI layer is responsible for end-to-end communication and error recovery?',
  options:[{content:'Transport Layer (Layer 4)',isCorrect:true},{content:'Network Layer (Layer 3)',isCorrect:false},{content:'Session Layer (Layer 5)',isCorrect:false},{content:'Data Link Layer (Layer 2)',isCorrect:false}],
  explanation:'Transport layer (TCP/UDP) provides end-to-end communication, flow control, and error recovery between hosts.' },

{ topicId:T.OSI, difficulty:'EASY', isPreviousYear:true,
  question:'Which layer of the OSI model converts data into bits for transmission?',
  options:[{content:'Physical Layer (Layer 1)',isCorrect:true},{content:'Data Link Layer (Layer 2)',isCorrect:false},{content:'Network Layer (Layer 3)',isCorrect:false},{content:'Application Layer (Layer 7)',isCorrect:false}],
  explanation:'Physical layer transmits raw bits over a physical medium (cables, radio waves) — deals with voltages, timing, and connectors.' },

{ topicId:T.OSI, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Which protocol operates at the Application layer of the TCP/IP model?',
  options:[{content:'HTTP',isCorrect:true},{content:'TCP',isCorrect:false},{content:'IP',isCorrect:false},{content:'Ethernet',isCorrect:false}],
  explanation:'Application layer protocols: HTTP, FTP, SMTP, DNS, DHCP. TCP operates at Transport; IP at Internet layer.' },

{ topicId:T.OSI, difficulty:'MEDIUM', isPreviousYear:false,
  question:'The Data Link layer provides:',
  options:[{content:'Node-to-node data transfer and error detection using frames',isCorrect:true},{content:'End-to-end data transfer',isCorrect:false},{content:'Routing of packets',isCorrect:false},{content:'User interface services',isCorrect:false}],
  explanation:'Data Link layer (Layer 2): frames data, handles MAC addresses, error detection (CRC), and flow control between adjacent nodes.' },

{ topicId:T.OSI, difficulty:'MEDIUM', isPreviousYear:true,
  question:'TCP/IP model has how many layers?',
  options:[{content:'4',isCorrect:true},{content:'7',isCorrect:false},{content:'5',isCorrect:false},{content:'3',isCorrect:false}],
  explanation:'TCP/IP model: Application, Transport, Internet (Network), Network Access (Link). 4 layers vs OSI\'s 7.' },

{ topicId:T.OSI, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Which device operates at the Data Link layer?',
  options:[{content:'Switch',isCorrect:true},{content:'Router',isCorrect:false},{content:'Hub',isCorrect:false},{content:'Gateway',isCorrect:false}],
  explanation:'Switch operates at Layer 2 (uses MAC addresses). Router at Layer 3. Hub at Layer 1. Gateway at multiple layers.' },

{ topicId:T.OSI, difficulty:'HARD', isPreviousYear:true,
  question:'Which layer adds port numbers to create a segment?',
  options:[{content:'Transport Layer',isCorrect:true},{content:'Network Layer',isCorrect:false},{content:'Data Link Layer',isCorrect:false},{content:'Session Layer',isCorrect:false}],
  explanation:'Transport layer adds source/destination port numbers to create segments (TCP) or datagrams (UDP).' },

{ topicId:T.OSI, difficulty:'HARD', isPreviousYear:false,
  question:'The TCP three-way handshake sequence is:',
  options:[{content:'SYN, SYN-ACK, ACK',isCorrect:true},{content:'ACK, SYN, SYN-ACK',isCorrect:false},{content:'SYN, ACK, SYN-ACK',isCorrect:false},{content:'SYN-ACK, SYN, ACK',isCorrect:false}],
  explanation:'TCP connection: Client sends SYN → Server responds SYN-ACK → Client sends ACK. Connection established.' },

{ topicId:T.OSI, difficulty:'HARD', isPreviousYear:true,
  question:'Which protocol at the Network layer is used for error reporting?',
  options:[{content:'ICMP',isCorrect:true},{content:'ARP',isCorrect:false},{content:'RARP',isCorrect:false},{content:'DHCP',isCorrect:false}],
  explanation:'ICMP (Internet Control Message Protocol) reports network errors and is used by "ping" and "traceroute".' },

{ topicId:T.OSI, difficulty:'HARD', isPreviousYear:false,
  question:'Sliding window protocol is used for:',
  options:[{content:'Flow control in TCP to prevent buffer overflow at receiver',isCorrect:true},{content:'Routing packets efficiently',isCorrect:false},{content:'Encrypting data in transit',isCorrect:false},{content:'Assigning IP addresses',isCorrect:false}],
  explanation:'Sliding window allows sender to transmit multiple frames before requiring ACK, improving throughput and managing flow.' },

{ topicId:T.OSI, difficulty:'EXPERT', isPreviousYear:true,
  question:'Which OSI layer handles data encryption and compression?',
  options:[{content:'Presentation Layer (Layer 6)',isCorrect:true},{content:'Application Layer (Layer 7)',isCorrect:false},{content:'Session Layer (Layer 5)',isCorrect:false},{content:'Transport Layer (Layer 4)',isCorrect:false}],
  explanation:'Presentation layer translates, encrypts/decrypts, and compresses data formats between application and network.' },

{ topicId:T.OSI, difficulty:'EXPERT', isPreviousYear:false,
  question:'BGP (Border Gateway Protocol) operates at which layer?',
  options:[{content:'Application Layer (routing information carried as application data)',isCorrect:true},{content:'Network Layer directly',isCorrect:false},{content:'Transport Layer',isCorrect:false},{content:'Data Link Layer',isCorrect:false}],
  explanation:'BGP is an application-layer protocol that uses TCP (port 179) to exchange routing information between autonomous systems.' },

{ topicId:T.OSI, difficulty:'EASY', isPreviousYear:false,
  question:'Which protocol provides reliable, ordered delivery of a stream of bytes?',
  options:[{content:'TCP',isCorrect:true},{content:'UDP',isCorrect:false},{content:'IP',isCorrect:false},{content:'ICMP',isCorrect:false}],
  explanation:'TCP (Transmission Control Protocol) provides connection-oriented, reliable, ordered, error-checked data delivery.' },

{ topicId:T.OSI, difficulty:'MEDIUM', isPreviousYear:true,
  question:'ARP operates at which layer interface?',
  options:[{content:'Between Network and Data Link layers',isCorrect:true},{content:'Application layer',isCorrect:false},{content:'Transport layer',isCorrect:false},{content:'Physical layer only',isCorrect:false}],
  explanation:'ARP bridges Layer 3 (IP addresses) and Layer 2 (MAC addresses), mapping logical to physical addresses.' },

// ─── PROGRAMMING FUNDAMENTALS (15) ───────────────────────────────────────────
{ topicId:T.PROG, difficulty:'EASY', isPreviousYear:true,
  question:'What is the output of: int x = 5; x = x + 3; printf("%d", x);',
  options:[{content:'8',isCorrect:true},{content:'5',isCorrect:false},{content:'3',isCorrect:false},{content:'53',isCorrect:false}],
  explanation:'x starts at 5, then x = 5+3 = 8. printf outputs 8.' },

{ topicId:T.PROG, difficulty:'EASY', isPreviousYear:false,
  question:'Which loop structure checks the condition after executing the loop body?',
  options:[{content:'do-while loop',isCorrect:true},{content:'while loop',isCorrect:false},{content:'for loop',isCorrect:false},{content:'foreach loop',isCorrect:false}],
  explanation:'do-while executes the body first, then checks the condition — guarantees at least one execution.' },

{ topicId:T.PROG, difficulty:'EASY', isPreviousYear:true,
  question:'A local variable in a function:',
  options:[{content:'Is accessible only within that function',isCorrect:true},{content:'Is accessible throughout the program',isCorrect:false},{content:'Retains value between function calls',isCorrect:false},{content:'Is stored in heap memory',isCorrect:false}],
  explanation:'Local variables exist on the stack, are created when the function is called, and destroyed when it returns.' },

{ topicId:T.PROG, difficulty:'MEDIUM', isPreviousYear:true,
  question:'What is the time complexity of a recursive Fibonacci function (naive)?',
  options:[{content:'O(2^n)',isCorrect:true},{content:'O(n)',isCorrect:false},{content:'O(n log n)',isCorrect:false},{content:'O(log n)',isCorrect:false}],
  explanation:'Naive Fibonacci recursion recalculates subproblems exponentially — O(2^n). Dynamic programming reduces it to O(n).' },

{ topicId:T.PROG, difficulty:'MEDIUM', isPreviousYear:false,
  question:'In C, what does the "static" keyword do when applied to a local variable?',
  options:[{content:'Retains the variable\'s value between function calls',isCorrect:true},{content:'Makes the variable accessible globally',isCorrect:false},{content:'Places the variable in heap memory',isCorrect:false},{content:'Makes it a constant',isCorrect:false}],
  explanation:'Static local variables are allocated once and retain their value between calls (stored in data segment, not stack).' },

{ topicId:T.PROG, difficulty:'MEDIUM', isPreviousYear:true,
  question:'What is recursion in programming?',
  options:[{content:'A function that calls itself with a modified argument until a base case is reached',isCorrect:true},{content:'A loop that iterates a fixed number of times',isCorrect:false},{content:'A function that calls another function repeatedly',isCorrect:false},{content:'A program that runs in parallel',isCorrect:false}],
  explanation:'Recursion: a function solves a problem by calling itself on smaller inputs, converging toward a base case.' },

{ topicId:T.PROG, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Which operator in C gives the remainder of integer division?',
  options:[{content:'%',isCorrect:true},{content:'/',isCorrect:false},{content:'\\',isCorrect:false},{content:'mod',isCorrect:false}],
  explanation:'% is the modulo operator: 10 % 3 = 1 (remainder when 10 is divided by 3).' },

{ topicId:T.PROG, difficulty:'HARD', isPreviousYear:true,
  question:'What does the following output? int a=2; printf("%d", a<<2);',
  options:[{content:'8',isCorrect:true},{content:'4',isCorrect:false},{content:'6',isCorrect:false},{content:'16',isCorrect:false}],
  explanation:'Left shift by 2: a<<2 = 2 × 2² = 2 × 4 = 8. Left shift by n multiplies by 2^n.' },

{ topicId:T.PROG, difficulty:'HARD', isPreviousYear:false,
  question:'Pointer arithmetic: if int *p points to arr[0], p+2 points to:',
  options:[{content:'arr[2]',isCorrect:true},{content:'arr[0]+2',isCorrect:false},{content:'The 2nd byte after arr[0]',isCorrect:false},{content:'arr[1]',isCorrect:false}],
  explanation:'Pointer arithmetic uses the base type size. p+2 advances by 2×sizeof(int) bytes, pointing to arr[2].' },

{ topicId:T.PROG, difficulty:'HARD', isPreviousYear:true,
  question:'Call by value vs call by reference: which does NOT allow the function to modify the original variable?',
  options:[{content:'Call by value',isCorrect:true},{content:'Call by reference',isCorrect:false},{content:'Call by pointer',isCorrect:false},{content:'Both allow modification',isCorrect:false}],
  explanation:'Call by value passes a copy — changes inside the function do not affect the original. Call by reference passes the address.' },

{ topicId:T.PROG, difficulty:'HARD', isPreviousYear:false,
  question:'What is tail recursion?',
  options:[{content:'Recursive call is the last operation in the function — can be optimized to iteration',isCorrect:true},{content:'Recursion that goes only two levels deep',isCorrect:false},{content:'Recursion without a base case',isCorrect:false},{content:'Multiple recursive calls in one function',isCorrect:false}],
  explanation:'Tail recursion: the recursive call is the final action. Compilers can optimize it to a loop (tail call optimization), avoiding stack growth.' },

{ topicId:T.PROG, difficulty:'EXPERT', isPreviousYear:true,
  question:'What is a segmentation fault?',
  options:[{content:'Program tries to access memory it is not allowed to access',isCorrect:true},{content:'The program runs out of heap memory',isCorrect:false},{content:'A syntax error at compile time',isCorrect:false},{content:'Integer overflow in calculation',isCorrect:false}],
  explanation:'Segfault occurs when a process accesses memory outside its allocated region (e.g., dereferencing NULL, out-of-bounds array access).' },

{ topicId:T.PROG, difficulty:'EXPERT', isPreviousYear:false,
  question:'Big O notation O(1) represents:',
  options:[{content:'Constant time — independent of input size',isCorrect:true},{content:'Zero operations',isCorrect:false},{content:'One operation exactly',isCorrect:false},{content:'Linear time',isCorrect:false}],
  explanation:'O(1) means execution time is constant regardless of input size (e.g., array index access, hash table lookup).' },

{ topicId:T.PROG, difficulty:'EASY', isPreviousYear:false,
  question:'Which data type stores a single character in C?',
  options:[{content:'char',isCorrect:true},{content:'string',isCorrect:false},{content:'int',isCorrect:false},{content:'byte',isCorrect:false}],
  explanation:'In C, char stores a single character (1 byte). C has no built-in string type — strings are char arrays.' },

{ topicId:T.PROG, difficulty:'MEDIUM', isPreviousYear:true,
  question:'What is the value of 5! (5 factorial)?',
  options:[{content:'120',isCorrect:true},{content:'25',isCorrect:false},{content:'60',isCorrect:false},{content:'100',isCorrect:false}],
  explanation:'5! = 5×4×3×2×1 = 120.' },

// ─── SEARCHING & SORTING ALGORITHMS (15) ─────────────────────────────────────
{ topicId:T.SORT, difficulty:'EASY', isPreviousYear:true,
  question:'What is the time complexity of Binary Search in a sorted array?',
  options:[{content:'O(log n)',isCorrect:true},{content:'O(n)',isCorrect:false},{content:'O(n log n)',isCorrect:false},{content:'O(1)',isCorrect:false}],
  explanation:'Binary search halves the search space each step: O(log n) comparisons in the worst case.' },

{ topicId:T.SORT, difficulty:'EASY', isPreviousYear:false,
  question:'Linear search has time complexity:',
  options:[{content:'O(n)',isCorrect:true},{content:'O(log n)',isCorrect:false},{content:'O(1)',isCorrect:false},{content:'O(n²)',isCorrect:false}],
  explanation:'Linear search checks each element one by one — O(n) in worst case (element not found or at end).' },

{ topicId:T.SORT, difficulty:'EASY', isPreviousYear:true,
  question:'Which sorting algorithm is known as the simplest but least efficient?',
  options:[{content:'Bubble Sort',isCorrect:true},{content:'Merge Sort',isCorrect:false},{content:'Quick Sort',isCorrect:false},{content:'Heap Sort',isCorrect:false}],
  explanation:'Bubble sort repeatedly swaps adjacent elements, O(n²) worst case — simple but inefficient for large datasets.' },

{ topicId:T.SORT, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Merge sort uses which algorithmic paradigm?',
  options:[{content:'Divide and Conquer',isCorrect:true},{content:'Greedy',isCorrect:false},{content:'Dynamic Programming',isCorrect:false},{content:'Backtracking',isCorrect:false}],
  explanation:'Merge sort: divide array in half, recursively sort each half, merge sorted halves. Classic divide-and-conquer.' },

{ topicId:T.SORT, difficulty:'MEDIUM', isPreviousYear:false,
  question:'What is the worst-case time complexity of Quick Sort?',
  options:[{content:'O(n²)',isCorrect:true},{content:'O(n log n)',isCorrect:false},{content:'O(n)',isCorrect:false},{content:'O(log n)',isCorrect:false}],
  explanation:'Quick sort worst case O(n²) occurs when the pivot is always the smallest or largest element (already sorted array with bad pivot choice).' },

{ topicId:T.SORT, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Which sorting algorithm has guaranteed O(n log n) time complexity in all cases?',
  options:[{content:'Merge Sort',isCorrect:true},{content:'Quick Sort',isCorrect:false},{content:'Bubble Sort',isCorrect:false},{content:'Insertion Sort',isCorrect:false}],
  explanation:'Merge sort is always O(n log n) — best, average, and worst case. Quick sort is O(n²) worst case.' },

{ topicId:T.SORT, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Insertion sort is efficient when:',
  options:[{content:'The array is nearly sorted',isCorrect:true},{content:'The array is in reverse order',isCorrect:false},{content:'The array has millions of elements',isCorrect:false},{content:'Duplicate elements are present',isCorrect:false}],
  explanation:'Insertion sort achieves O(n) on nearly sorted arrays since few comparisons and shifts are needed.' },

{ topicId:T.SORT, difficulty:'HARD', isPreviousYear:true,
  question:'Heap sort builds a heap and then sorts. Its time complexity is:',
  options:[{content:'O(n log n) in all cases',isCorrect:true},{content:'O(n²)',isCorrect:false},{content:'O(n)',isCorrect:false},{content:'O(log n)',isCorrect:false}],
  explanation:'Heap sort: build heap O(n), extract n elements each O(log n) → total O(n log n). In-place, not stable.' },

{ topicId:T.SORT, difficulty:'HARD', isPreviousYear:false,
  question:'A stable sorting algorithm maintains:',
  options:[{content:'Relative order of equal elements in the sorted output',isCorrect:true},{content:'Sorted order for all input types',isCorrect:false},{content:'O(n log n) time complexity',isCorrect:false},{content:'Minimum memory usage',isCorrect:false}],
  explanation:'Stable sort: if a[i] == a[j] and i < j before sorting, a[i] appears before a[j] after sorting. Merge sort is stable; Quick sort is not.' },

{ topicId:T.SORT, difficulty:'HARD', isPreviousYear:true,
  question:'Which algorithm finds the k-th smallest element in O(n) average time?',
  options:[{content:'QuickSelect (partition-based selection)',isCorrect:true},{content:'Sorting and indexing',isCorrect:false},{content:'Binary search',isCorrect:false},{content:'Linear search with tracking',isCorrect:false}],
  explanation:'QuickSelect uses Quick sort\'s partitioning: after partitioning, recursively search only one side. O(n) average, O(n²) worst.' },

{ topicId:T.SORT, difficulty:'HARD', isPreviousYear:false,
  question:'Counting sort has time complexity O(n+k) where k is:',
  options:[{content:'The range of input values',isCorrect:true},{content:'The number of unique elements',isCorrect:false},{content:'The size of auxiliary array only',isCorrect:false},{content:'The log of n',isCorrect:false}],
  explanation:'Counting sort counts occurrences of each value (range k). Efficient when k = O(n); impractical when k >> n.' },

{ topicId:T.SORT, difficulty:'EXPERT', isPreviousYear:true,
  question:'Binary search requires the array to be:',
  options:[{content:'Sorted',isCorrect:true},{content:'In reverse order',isCorrect:false},{content:'Stored in a linked list',isCorrect:false},{content:'Distinct values only',isCorrect:false}],
  explanation:'Binary search only works on sorted arrays. It compares with the middle element and eliminates half the search space.' },

{ topicId:T.SORT, difficulty:'EXPERT', isPreviousYear:false,
  question:'The lower bound for comparison-based sorting is:',
  options:[{content:'Ω(n log n)',isCorrect:true},{content:'Ω(n)',isCorrect:false},{content:'Ω(n²)',isCorrect:false},{content:'Ω(log n)',isCorrect:false}],
  explanation:'Any comparison-based sorting algorithm requires at least Ω(n log n) comparisons in the worst case (information-theoretic lower bound).' },

{ topicId:T.SORT, difficulty:'EASY', isPreviousYear:false,
  question:'Selection sort selects:',
  options:[{content:'The minimum element and places it at the beginning in each pass',isCorrect:true},{content:'Any random element and sorts',isCorrect:false},{content:'Adjacent elements and swaps them if out of order',isCorrect:false},{content:'The median element as pivot',isCorrect:false}],
  explanation:'Selection sort: find minimum in unsorted portion, swap with the first unsorted position. O(n²) always.' },

{ topicId:T.SORT, difficulty:'MEDIUM', isPreviousYear:true,
  question:'What is the best-case time complexity of Bubble Sort?',
  options:[{content:'O(n) — when array is already sorted',isCorrect:true},{content:'O(n²)',isCorrect:false},{content:'O(n log n)',isCorrect:false},{content:'O(1)',isCorrect:false}],
  explanation:'With an early-exit optimization (stop if no swaps in a pass), best case is O(n) for an already-sorted array.' },

// ─── SOFTWARE ENGINEERING (15) ────────────────────────────────────────────────
{ topicId:T.SE, difficulty:'EASY', isPreviousYear:true,
  question:'Which SDLC model follows a sequential linear process?',
  options:[{content:'Waterfall Model',isCorrect:true},{content:'Agile Model',isCorrect:false},{content:'Spiral Model',isCorrect:false},{content:'Prototype Model',isCorrect:false}],
  explanation:'Waterfall model: Requirements → Design → Implementation → Testing → Maintenance, each phase completing before next begins.' },

{ topicId:T.SE, difficulty:'EASY', isPreviousYear:false,
  question:'Which testing is done by the development team to test individual units of code?',
  options:[{content:'Unit Testing',isCorrect:true},{content:'Integration Testing',isCorrect:false},{content:'System Testing',isCorrect:false},{content:'Acceptance Testing',isCorrect:false}],
  explanation:'Unit testing tests individual functions/methods in isolation. Integration testing tests component interactions.' },

{ topicId:T.SE, difficulty:'EASY', isPreviousYear:true,
  question:'Software Requirements Specification (SRS) document describes:',
  options:[{content:'What the system should do (functional and non-functional requirements)',isCorrect:true},{content:'How the system will be implemented',isCorrect:false},{content:'Test cases for the system',isCorrect:false},{content:'User manuals and help files',isCorrect:false}],
  explanation:'SRS is the foundation document capturing all requirements — functional (what), non-functional (how well), and constraints.' },

{ topicId:T.SE, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Agile methodology emphasizes:',
  options:[{content:'Iterative development, collaboration, and responding to change',isCorrect:true},{content:'Comprehensive documentation over working software',isCorrect:false},{content:'Following a fixed plan rigorously',isCorrect:false},{content:'Contract negotiation over customer collaboration',isCorrect:false}],
  explanation:'Agile Manifesto: Individuals & interactions, Working software, Customer collaboration, Responding to change — over their left-side counterparts.' },

{ topicId:T.SE, difficulty:'MEDIUM', isPreviousYear:false,
  question:'McCabe\'s Cyclomatic Complexity measures:',
  options:[{content:'The number of linearly independent paths through a program',isCorrect:true},{content:'Lines of code',isCorrect:false},{content:'Number of bugs found',isCorrect:false},{content:'Memory usage of the program',isCorrect:false}],
  explanation:'Cyclomatic complexity V(G) = E - N + 2P (edges - nodes + 2×connected components). Higher value = more complex, harder to test.' },

{ topicId:T.SE, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Black-box testing is based on:',
  options:[{content:'Testing based on specifications without knowledge of internal code',isCorrect:true},{content:'Testing with full knowledge of source code',isCorrect:false},{content:'Testing hardware components',isCorrect:false},{content:'Performance benchmarking',isCorrect:false}],
  explanation:'Black-box (functional) testing treats the software as a black box — testers don\'t know internal implementation, only inputs/outputs.' },

{ topicId:T.SE, difficulty:'MEDIUM', isPreviousYear:false,
  question:'White-box testing examines:',
  options:[{content:'Internal structure and logic of the code',isCorrect:true},{content:'Only the user interface',isCorrect:false},{content:'System performance under load',isCorrect:false},{content:'Requirements compliance only',isCorrect:false}],
  explanation:'White-box (structural) testing uses knowledge of internal code to design test cases (branch coverage, path coverage, etc.).' },

{ topicId:T.SE, difficulty:'HARD', isPreviousYear:true,
  question:'The Spiral model of SDLC is characterized by:',
  options:[{content:'Repeated cycles of planning, risk analysis, engineering, and evaluation',isCorrect:true},{content:'Sequential phases with no iteration',isCorrect:false},{content:'Rapid prototyping without risk analysis',isCorrect:false},{content:'Customer-driven sprints of 2 weeks',isCorrect:false}],
  explanation:'Spiral model (Boehm): each iteration is a spiral — determine objectives, identify risks, develop, evaluate. Risk-driven.' },

{ topicId:T.SE, difficulty:'HARD', isPreviousYear:false,
  question:'Regression testing is performed to:',
  options:[{content:'Ensure new changes have not broken existing functionality',isCorrect:true},{content:'Test the system under extreme load',isCorrect:false},{content:'Verify requirements before development',isCorrect:false},{content:'Test individual modules in isolation',isCorrect:false}],
  explanation:'Regression testing re-runs existing test cases after code changes to detect unintended side effects (regressions).' },

{ topicId:T.SE, difficulty:'HARD', isPreviousYear:true,
  question:'Coupling in software engineering refers to:',
  options:[{content:'The degree of interdependence between software modules',isCorrect:true},{content:'The number of functions in a module',isCorrect:false},{content:'How well a module performs its function',isCorrect:false},{content:'The size of a software component',isCorrect:false}],
  explanation:'Low coupling (modules are independent) is desirable. High cohesion within a module and low coupling between modules = good design.' },

{ topicId:T.SE, difficulty:'HARD', isPreviousYear:false,
  question:'COCOMO model is used for:',
  options:[{content:'Software cost and effort estimation',isCorrect:true},{content:'Database design',isCorrect:false},{content:'Network topology planning',isCorrect:false},{content:'Testing coverage analysis',isCorrect:false}],
  explanation:'COCOMO (Constructive Cost Model) estimates software project effort, cost, and schedule based on lines of code (KLOC).' },

{ topicId:T.SE, difficulty:'EXPERT', isPreviousYear:true,
  question:'Software quality attribute "Maintainability" refers to:',
  options:[{content:'Ease with which the software can be modified to fix defects or add features',isCorrect:true},{content:'Speed of software execution',isCorrect:false},{content:'Security against unauthorized access',isCorrect:false},{content:'Ability to run on multiple platforms',isCorrect:false}],
  explanation:'Maintainability measures how easily software can be changed: understandability, modifiability, testability, reusability.' },

{ topicId:T.SE, difficulty:'EXPERT', isPreviousYear:false,
  question:'Which design principle states a class should have only one reason to change?',
  options:[{content:'Single Responsibility Principle (SRP)',isCorrect:true},{content:'Open/Closed Principle',isCorrect:false},{content:'Liskov Substitution Principle',isCorrect:false},{content:'Interface Segregation Principle',isCorrect:false}],
  explanation:'SRP (first SOLID principle): each class/module should have only one responsibility, making code easier to maintain.' },

{ topicId:T.SE, difficulty:'EASY', isPreviousYear:false,
  question:'What does "version control" do in software development?',
  options:[{content:'Tracks changes to code over time and allows reverting to previous versions',isCorrect:true},{content:'Controls software licensing',isCorrect:false},{content:'Manages server deployment',isCorrect:false},{content:'Optimizes code performance',isCorrect:false}],
  explanation:'Version control (e.g., Git) tracks changes, enables collaboration, and allows reverting to any previous state.' },

{ topicId:T.SE, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Alpha testing is conducted by:',
  options:[{content:'The development team in a controlled environment',isCorrect:true},{content:'End users at their locations',isCorrect:false},{content:'Automated testing tools',isCorrect:false},{content:'An independent testing team',isCorrect:false}],
  explanation:'Alpha testing: internal testing by developers. Beta testing: external testing by selected end users before public release.' },

// ─── SQL (15) ─────────────────────────────────────────────────────────────────
{ topicId:T.SQL, difficulty:'EASY', isPreviousYear:true,
  question:'Which SQL command retrieves data from a table?',
  options:[{content:'SELECT',isCorrect:true},{content:'INSERT',isCorrect:false},{content:'UPDATE',isCorrect:false},{content:'DELETE',isCorrect:false}],
  explanation:'SELECT retrieves records from one or more tables based on specified conditions.' },

{ topicId:T.SQL, difficulty:'EASY', isPreviousYear:false,
  question:'Which clause filters rows AFTER aggregation in SQL?',
  options:[{content:'HAVING',isCorrect:true},{content:'WHERE',isCorrect:false},{content:'GROUP BY',isCorrect:false},{content:'ORDER BY',isCorrect:false}],
  explanation:'HAVING filters groups after GROUP BY aggregation. WHERE filters individual rows before aggregation.' },

{ topicId:T.SQL, difficulty:'EASY', isPreviousYear:true,
  question:'Which SQL function counts the number of rows?',
  options:[{content:'COUNT(*)',isCorrect:true},{content:'SUM()',isCorrect:false},{content:'AVG()',isCorrect:false},{content:'MAX()',isCorrect:false}],
  explanation:'COUNT(*) counts all rows including NULLs. COUNT(column) counts non-NULL values in that column.' },

{ topicId:T.SQL, difficulty:'MEDIUM', isPreviousYear:true,
  question:'SELECT * FROM students WHERE age > 20 ORDER BY name DESC; — which clause sorts results?',
  options:[{content:'ORDER BY name DESC',isCorrect:true},{content:'WHERE age > 20',isCorrect:false},{content:'SELECT *',isCorrect:false},{content:'FROM students',isCorrect:false}],
  explanation:'ORDER BY sorts the result set. DESC = descending order. ASC = ascending (default).' },

{ topicId:T.SQL, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Which JOIN returns only matching rows from both tables?',
  options:[{content:'INNER JOIN',isCorrect:true},{content:'LEFT JOIN',isCorrect:false},{content:'RIGHT JOIN',isCorrect:false},{content:'CROSS JOIN',isCorrect:false}],
  explanation:'INNER JOIN returns only rows where the join condition is satisfied in both tables.' },

{ topicId:T.SQL, difficulty:'MEDIUM', isPreviousYear:true,
  question:'The GROUP BY clause is used to:',
  options:[{content:'Group rows with the same values in specified columns for aggregate functions',isCorrect:true},{content:'Sort the result set',isCorrect:false},{content:'Join multiple tables',isCorrect:false},{content:'Remove duplicate rows',isCorrect:false}],
  explanation:'GROUP BY groups rows sharing the same values. Used with aggregate functions like COUNT, SUM, AVG, MAX, MIN.' },

{ topicId:T.SQL, difficulty:'MEDIUM', isPreviousYear:false,
  question:'What does DISTINCT do in SQL?',
  options:[{content:'Returns only unique values, removing duplicates',isCorrect:true},{content:'Sorts the results',isCorrect:false},{content:'Limits number of rows returned',isCorrect:false},{content:'Selects all columns',isCorrect:false}],
  explanation:'SELECT DISTINCT column returns unique values only. Useful for de-duplicating result sets.' },

{ topicId:T.SQL, difficulty:'HARD', isPreviousYear:true,
  question:'Which of the following is correct for creating a table with a primary key?',
  options:[{content:'CREATE TABLE emp (id INT PRIMARY KEY, name VARCHAR(50));',isCorrect:true},{content:'CREATE TABLE emp (id INT UNIQUE, name VARCHAR(50));',isCorrect:false},{content:'INSERT INTO emp (id PRIMARY KEY) VALUES (1);',isCorrect:false},{content:'ALTER TABLE emp UNIQUE KEY id;',isCorrect:false}],
  explanation:'PRIMARY KEY constraint is defined in CREATE TABLE either inline with the column or as a table constraint.' },

{ topicId:T.SQL, difficulty:'HARD', isPreviousYear:false,
  question:'A subquery in SQL is:',
  options:[{content:'A query nested inside another query',isCorrect:true},{content:'A stored procedure',isCorrect:false},{content:'A view definition',isCorrect:false},{content:'A query that returns no rows',isCorrect:false}],
  explanation:'Subqueries (inner queries) are SELECT statements nested within WHERE, FROM, HAVING, or SELECT clauses.' },

{ topicId:T.SQL, difficulty:'HARD', isPreviousYear:true,
  question:'What does the following SQL do: DELETE FROM employees WHERE department = \'HR\';',
  options:[{content:'Deletes all rows where department is HR',isCorrect:true},{content:'Deletes the HR department column',isCorrect:false},{content:'Marks HR rows as inactive',isCorrect:false},{content:'Creates a backup of HR rows',isCorrect:false}],
  explanation:'DELETE removes rows matching the WHERE condition. Without WHERE, it deletes ALL rows.' },

{ topicId:T.SQL, difficulty:'HARD', isPreviousYear:false,
  question:'What is the difference between TRUNCATE and DELETE?',
  options:[{content:'TRUNCATE removes all rows fast without logging each row; DELETE can use WHERE',isCorrect:true},{content:'TRUNCATE deletes the table structure; DELETE only removes data',isCorrect:false},{content:'Both are identical',isCorrect:false},{content:'DELETE is faster than TRUNCATE',isCorrect:false}],
  explanation:'TRUNCATE: DDL, removes all rows, faster, cannot use WHERE, resets identity. DELETE: DML, logged row-by-row, supports WHERE.' },

{ topicId:T.SQL, difficulty:'EXPERT', isPreviousYear:true,
  question:'SELECT dept, AVG(salary) FROM emp GROUP BY dept HAVING AVG(salary) > 50000; — what does this return?',
  options:[{content:'Departments where the average salary exceeds 50000',isCorrect:true},{content:'All employees earning more than 50000',isCorrect:false},{content:'Employees grouped by department with salary > 50000',isCorrect:false},{content:'Average salary of all departments',isCorrect:false}],
  explanation:'HAVING AVG(salary) > 50000 filters groups (departments) where the average salary is above 50000.' },

{ topicId:T.SQL, difficulty:'EXPERT', isPreviousYear:false,
  question:'A VIEW in SQL is:',
  options:[{content:'A virtual table based on the result of a SELECT query',isCorrect:true},{content:'A physical copy of a table',isCorrect:false},{content:'An index on a table',isCorrect:false},{content:'A stored procedure that returns data',isCorrect:false}],
  explanation:'A view is a named query stored in the database. It provides a virtual table that can simplify complex queries and restrict data access.' },

{ topicId:T.SQL, difficulty:'EASY', isPreviousYear:false,
  question:'Which SQL clause limits the number of rows returned?',
  options:[{content:'LIMIT (or TOP in SQL Server)',isCorrect:true},{content:'WHERE',isCorrect:false},{content:'HAVING',isCorrect:false},{content:'GROUP BY',isCorrect:false}],
  explanation:'LIMIT n (MySQL/PostgreSQL) or TOP n (SQL Server) restricts the result to n rows.' },

{ topicId:T.SQL, difficulty:'MEDIUM', isPreviousYear:true,
  question:'The SQL statement UPDATE employees SET salary = salary * 1.1 WHERE dept = \'IT\'; does what?',
  options:[{content:'Increases salary by 10% for all IT department employees',isCorrect:true},{content:'Sets IT salaries to 1.1',isCorrect:false},{content:'Multiplies all salaries by 1.1',isCorrect:false},{content:'Creates a new salary column',isCorrect:false}],
  explanation:'Multiplying current salary by 1.1 gives a 10% increase. The WHERE clause restricts it to IT department only.' },

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
  console.log(`\nPart 3 — ${MCQS.length} MCQs: OSI/TCP-IP, Programming Fundamentals, Searching & Sorting, Software Engineering, SQL\n`);
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
