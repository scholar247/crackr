export {};
/**
 * NIMCET Computer Awareness — Part 1 (topics 1–6)
 * Run: npx tsx scripts/seed-nimcet-ca-part1.ts
 */

const BASE = 'https://scholar247.org';
const KEY  = 'd846e4f1862433c8d265f459f5264b721c28a93057c9b7949d8a4cf98e7bdb9f';
const EXAM_ID    = '626534b9-0ac4-4d73-a400-7391b645338a';
const SUBJECT_ID = '14c706f0-dca1-42eb-a800-b7a04c7eb8bb'; // Computer Awareness

const T = {
  BOOL:   'fa34e1cf-5d44-4e63-9730-b87ad49738b9', // Boolean Algebra & Logic Gates
  FUND:   'bbab7684-0d13-490c-bdf8-5ef1a77d0d5a', // Computer Fundamentals
  NETS:   '8216eaa7-f9eb-46c1-87d6-74b5115b4829', // Computer Networks
  ARCH:   '01fdd5d1-2499-479b-873c-c72bbc4899e7', // Computer Organization & Architecture
  CYBER:  'c80383f9-79cd-471a-a721-b0f6c728cfa8', // Cyber Security
  DS:     '666b4f41-97dc-4052-8d01-457111833382', // Data Structures
};

type D = 'EASY'|'MEDIUM'|'HARD'|'EXPERT';
interface Q { topicId:string; difficulty:D; question:string; options:{content:string;isCorrect:boolean}[]; explanation?:string; isPreviousYear?:boolean; }

const MCQS: Q[] = [

// ─── COMPUTER FUNDAMENTALS (15) ──────────────────────────────────────────────
{ topicId:T.FUND, difficulty:'EASY', isPreviousYear:true,
  question:'Which generation of computers used vacuum tubes?',
  options:[{content:'First Generation',isCorrect:true},{content:'Second Generation',isCorrect:false},{content:'Third Generation',isCorrect:false},{content:'Fourth Generation',isCorrect:false}],
  explanation:'First generation computers (1940s–1950s) used vacuum tubes as electronic components.' },

{ topicId:T.FUND, difficulty:'EASY', isPreviousYear:false,
  question:'Which of the following is an example of a primary memory?',
  options:[{content:'RAM',isCorrect:true},{content:'Hard Disk',isCorrect:false},{content:'DVD',isCorrect:false},{content:'USB Drive',isCorrect:false}],
  explanation:'RAM (Random Access Memory) is primary/main memory directly accessible by the CPU.' },

{ topicId:T.FUND, difficulty:'EASY', isPreviousYear:true,
  question:'The full form of ALU is:',
  options:[{content:'Arithmetic Logic Unit',isCorrect:true},{content:'Arithmetic Logical Unit',isCorrect:false},{content:'Array Logic Unit',isCorrect:false},{content:'Arithmetic Load Unit',isCorrect:false}],
  explanation:'ALU stands for Arithmetic Logic Unit — performs arithmetic and logical operations.' },

{ topicId:T.FUND, difficulty:'EASY', isPreviousYear:false,
  question:'Which device is used to translate high-level language programs into machine language?',
  options:[{content:'Compiler',isCorrect:true},{content:'Assembler',isCorrect:false},{content:'Linker',isCorrect:false},{content:'Loader',isCorrect:false}],
  explanation:'A compiler translates the entire high-level language program into machine code at once.' },

{ topicId:T.FUND, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Which of the following is NOT an input device?',
  options:[{content:'Plotter',isCorrect:true},{content:'Scanner',isCorrect:false},{content:'Keyboard',isCorrect:false},{content:'Light Pen',isCorrect:false}],
  explanation:'A plotter is an output device used to produce large drawings. The others are input devices.' },

{ topicId:T.FUND, difficulty:'MEDIUM', isPreviousYear:false,
  question:'BIOS is stored in which type of memory?',
  options:[{content:'ROM',isCorrect:true},{content:'RAM',isCorrect:false},{content:'Cache',isCorrect:false},{content:'Virtual Memory',isCorrect:false}],
  explanation:'BIOS (Basic Input/Output System) is stored in ROM (Read-Only Memory) so it persists without power.' },

{ topicId:T.FUND, difficulty:'MEDIUM', isPreviousYear:true,
  question:'The number of bits in a byte is:',
  options:[{content:'8',isCorrect:true},{content:'4',isCorrect:false},{content:'16',isCorrect:false},{content:'32',isCorrect:false}],
  explanation:'1 byte = 8 bits. This is the standard unit of digital information.' },

{ topicId:T.FUND, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Which type of software controls the hardware resources of a computer?',
  options:[{content:'Operating System',isCorrect:true},{content:'Application Software',isCorrect:false},{content:'Utility Software',isCorrect:false},{content:'Firmware',isCorrect:false}],
  explanation:'The Operating System is system software that manages hardware resources and provides services for application programs.' },

{ topicId:T.FUND, difficulty:'MEDIUM', isPreviousYear:true,
  question:'In which generation of computers did the use of Integrated Circuits (ICs) begin?',
  options:[{content:'Third Generation',isCorrect:true},{content:'Second Generation',isCorrect:false},{content:'Fourth Generation',isCorrect:false},{content:'Fifth Generation',isCorrect:false}],
  explanation:'ICs were introduced in the third generation (1964–1971), replacing individual transistors.' },

{ topicId:T.FUND, difficulty:'HARD', isPreviousYear:false,
  question:'A computer with a 32-bit address bus can directly address how much memory?',
  options:[{content:'4 GB',isCorrect:true},{content:'2 GB',isCorrect:false},{content:'1 GB',isCorrect:false},{content:'8 GB',isCorrect:false}],
  explanation:'2^32 bytes = 4,294,967,296 bytes = 4 GB of addressable memory.' },

{ topicId:T.FUND, difficulty:'HARD', isPreviousYear:true,
  question:'What is the clock speed of a processor measured in?',
  options:[{content:'GHz (Gigahertz)',isCorrect:true},{content:'GB (Gigabytes)',isCorrect:false},{content:'MIPS',isCorrect:false},{content:'Mbps',isCorrect:false}],
  explanation:'Processor speed is measured in GHz (Gigahertz), indicating how many clock cycles per second.' },

{ topicId:T.FUND, difficulty:'HARD', isPreviousYear:false,
  question:'Which of the following is true about machine language?',
  options:[{content:'It consists of binary instructions (0s and 1s) directly executed by CPU',isCorrect:true},{content:'It is a high-level language requiring a compiler',isCorrect:false},{content:'It uses English-like syntax',isCorrect:false},{content:'It is platform-independent',isCorrect:false}],
  explanation:'Machine language is the lowest-level language consisting of binary code (0s and 1s) directly understood by the CPU.' },

{ topicId:T.FUND, difficulty:'HARD', isPreviousYear:true,
  question:'Which unit converts digital signals to analog signals for transmission over telephone lines?',
  options:[{content:'Modem',isCorrect:true},{content:'Router',isCorrect:false},{content:'Gateway',isCorrect:false},{content:'Hub',isCorrect:false}],
  explanation:'A modem (modulator-demodulator) converts digital signals to analog for phone line transmission and back.' },

{ topicId:T.FUND, difficulty:'EXPERT', isPreviousYear:false,
  question:'The Von Neumann architecture is characterized by:',
  options:[{content:'Shared memory for instructions and data',isCorrect:true},{content:'Separate memories for instructions and data',isCorrect:false},{content:'No memory — registers only',isCorrect:false},{content:'Distributed processing across multiple CPUs',isCorrect:false}],
  explanation:'Von Neumann architecture uses a single shared memory for both program instructions and data, processed sequentially.' },

{ topicId:T.FUND, difficulty:'EXPERT', isPreviousYear:true,
  question:'Which of the following represents the correct memory hierarchy from fastest to slowest?',
  options:[{content:'Registers → Cache → RAM → Hard Disk → Optical Disk',isCorrect:true},{content:'Cache → Registers → RAM → Hard Disk',isCorrect:false},{content:'RAM → Cache → Registers → Hard Disk',isCorrect:false},{content:'Hard Disk → RAM → Cache → Registers',isCorrect:false}],
  explanation:'Memory hierarchy: Registers (fastest, smallest) → Cache → RAM → Hard Disk → Optical (slowest, largest).' },

// ─── NUMBER SYSTEMS & DATA REPRESENTATION (15) ───────────────────────────────
{ topicId:T.ARCH, difficulty:'EASY', isPreviousYear:true,
  question:'What is the decimal equivalent of binary number 1010?',
  options:[{content:'10',isCorrect:true},{content:'12',isCorrect:false},{content:'8',isCorrect:false},{content:'14',isCorrect:false}],
  explanation:'1010 = 1×2³ + 0×2² + 1×2¹ + 0×2⁰ = 8+0+2+0 = 10.' },

{ topicId:T.ARCH, difficulty:'EASY', isPreviousYear:false,
  question:'The hexadecimal number F is equal to which decimal number?',
  options:[{content:'15',isCorrect:true},{content:'16',isCorrect:false},{content:'14',isCorrect:false},{content:'12',isCorrect:false}],
  explanation:'In hexadecimal: A=10, B=11, C=12, D=13, E=14, F=15.' },

{ topicId:T.ARCH, difficulty:'EASY', isPreviousYear:true,
  question:'How many bits are required to represent the decimal number 255 in binary?',
  options:[{content:'8',isCorrect:true},{content:'7',isCorrect:false},{content:'9',isCorrect:false},{content:'16',isCorrect:false}],
  explanation:'255 = 11111111 in binary, which requires 8 bits.' },

{ topicId:T.ARCH, difficulty:'MEDIUM', isPreviousYear:true,
  question:'The 2\'s complement of 0110 is:',
  options:[{content:'1010',isCorrect:true},{content:'1001',isCorrect:false},{content:'1110',isCorrect:false},{content:'0110',isCorrect:false}],
  explanation:'1\'s complement of 0110 = 1001. 2\'s complement = 1001 + 1 = 1010.' },

{ topicId:T.ARCH, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Convert hexadecimal A3 to decimal:',
  options:[{content:'163',isCorrect:true},{content:'153',isCorrect:false},{content:'173',isCorrect:false},{content:'143',isCorrect:false}],
  explanation:'A3₁₆ = 10×16 + 3 = 160+3 = 163.' },

{ topicId:T.ARCH, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Which code is used to represent alphanumeric characters in computers?',
  options:[{content:'ASCII',isCorrect:true},{content:'BCD',isCorrect:false},{content:'EBCDIC (only)',isCorrect:false},{content:'Gray Code',isCorrect:false}],
  explanation:'ASCII (American Standard Code for Information Interchange) is the most widely used code for alphanumeric characters.' },

{ topicId:T.ARCH, difficulty:'MEDIUM', isPreviousYear:false,
  question:'The octal equivalent of binary 111000 is:',
  options:[{content:'70',isCorrect:true},{content:'56',isCorrect:false},{content:'63',isCorrect:false},{content:'72',isCorrect:false}],
  explanation:'Group binary in triplets: 111 000 → 7 0 = 70 in octal.' },

{ topicId:T.ARCH, difficulty:'MEDIUM', isPreviousYear:true,
  question:'In BCD (Binary Coded Decimal), each decimal digit is represented using how many bits?',
  options:[{content:'4',isCorrect:true},{content:'8',isCorrect:false},{content:'2',isCorrect:false},{content:'16',isCorrect:false}],
  explanation:'In BCD, each decimal digit (0–9) is encoded using 4 binary bits.' },

{ topicId:T.ARCH, difficulty:'HARD', isPreviousYear:true,
  question:'What is the result of adding binary 1101 + 0110?',
  options:[{content:'10011',isCorrect:true},{content:'10001',isCorrect:false},{content:'10100',isCorrect:false},{content:'10111',isCorrect:false}],
  explanation:'1101 + 0110: 1+0=1, 0+1=1, 1+1=10 (write 0 carry 1), 1+0+1=10. Result = 10011.' },

{ topicId:T.ARCH, difficulty:'HARD', isPreviousYear:false,
  question:'IEEE 754 single-precision floating point uses how many bits for the exponent?',
  options:[{content:'8',isCorrect:true},{content:'23',isCorrect:false},{content:'1',isCorrect:false},{content:'16',isCorrect:false}],
  explanation:'IEEE 754 single-precision: 1 sign bit, 8 exponent bits, 23 mantissa bits = 32 bits total.' },

{ topicId:T.ARCH, difficulty:'HARD', isPreviousYear:true,
  question:'The 1\'s complement of 10110010 is:',
  options:[{content:'01001101',isCorrect:true},{content:'01001110',isCorrect:false},{content:'10110011',isCorrect:false},{content:'01001100',isCorrect:false}],
  explanation:'1\'s complement = flip all bits: 10110010 → 01001101.' },

{ topicId:T.ARCH, difficulty:'HARD', isPreviousYear:false,
  question:'In a signed 8-bit 2\'s complement representation, the range of values is:',
  options:[{content:'-128 to +127',isCorrect:true},{content:'-127 to +127',isCorrect:false},{content:'-128 to +128',isCorrect:false},{content:'0 to 255',isCorrect:false}],
  explanation:'Signed 8-bit 2\'s complement range: -2^7 = -128 (minimum) to 2^7 - 1 = 127 (maximum).' },

{ topicId:T.ARCH, difficulty:'EXPERT', isPreviousYear:true,
  question:'Convert decimal 175 to hexadecimal:',
  options:[{content:'AF',isCorrect:true},{content:'BF',isCorrect:false},{content:'AE',isCorrect:false},{content:'BE',isCorrect:false}],
  explanation:'175 ÷ 16 = 10 remainder 15. 10=A, 15=F → AF₁₆.' },

{ topicId:T.ARCH, difficulty:'EXPERT', isPreviousYear:false,
  question:'What is the minimum number of bits needed to represent 1000 distinct values?',
  options:[{content:'10',isCorrect:true},{content:'9',isCorrect:false},{content:'11',isCorrect:false},{content:'8',isCorrect:false}],
  explanation:'2^9 = 512 < 1000 ≤ 1024 = 2^10. So 10 bits are required.' },

{ topicId:T.ARCH, difficulty:'EXPERT', isPreviousYear:true,
  question:'In Gray code, the decimal sequence 0, 1, 2, 3 is represented as:',
  options:[{content:'00, 01, 11, 10',isCorrect:true},{content:'00, 01, 10, 11',isCorrect:false},{content:'00, 11, 01, 10',isCorrect:false},{content:'00, 10, 11, 01',isCorrect:false}],
  explanation:'Gray code changes only one bit between consecutive values: 0→00, 1→01, 2→11, 3→10.' },

// ─── BOOLEAN ALGEBRA & LOGIC GATES (15) ──────────────────────────────────────
{ topicId:T.BOOL, difficulty:'EASY', isPreviousYear:true,
  question:'What is the output of an AND gate when both inputs are 1?',
  options:[{content:'1',isCorrect:true},{content:'0',isCorrect:false},{content:'Undefined',isCorrect:false},{content:'Depends on voltage',isCorrect:false}],
  explanation:'AND gate output is 1 only when ALL inputs are 1.' },

{ topicId:T.BOOL, difficulty:'EASY', isPreviousYear:false,
  question:'Which gate gives output 1 when any one input is 1?',
  options:[{content:'OR gate',isCorrect:true},{content:'AND gate',isCorrect:false},{content:'NOT gate',isCorrect:false},{content:'XNOR gate',isCorrect:false}],
  explanation:'OR gate output is 1 if at least one input is 1.' },

{ topicId:T.BOOL, difficulty:'EASY', isPreviousYear:true,
  question:'De Morgan\'s theorem states: (A·B) = ?',
  options:[{content:"A' + B'",isCorrect:true},{content:"A' · B'",isCorrect:false},{content:'A + B',isCorrect:false},{content:'A · B',isCorrect:false}],
  explanation:"De Morgan's first theorem: (A·B)' = A' + B' (complement of AND = OR of complements)." },

{ topicId:T.BOOL, difficulty:'EASY', isPreviousYear:false,
  question:'What is the Boolean expression for a NAND gate with inputs A and B?',
  options:[{content:"(A·B)'",isCorrect:true},{content:"A'·B'",isCorrect:false},{content:'A+B',isCorrect:false},{content:"(A+B)'",isCorrect:false}],
  explanation:'NAND = NOT(AND). Output = (A·B)\'.' },

{ topicId:T.BOOL, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Simplify Boolean expression: A + A\'B',
  options:[{content:'A + B',isCorrect:true},{content:'A',isCorrect:false},{content:'AB',isCorrect:false},{content:'A + A\'',isCorrect:false}],
  explanation:'A + A\'B = (A + A\')(A + B) = 1·(A+B) = A + B (absorption/distribution).' },

{ topicId:T.BOOL, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Which gate produces output 1 only when inputs are different?',
  options:[{content:'XOR gate',isCorrect:true},{content:'XNOR gate',isCorrect:false},{content:'NAND gate',isCorrect:false},{content:'NOR gate',isCorrect:false}],
  explanation:'XOR (Exclusive OR) output is 1 when the inputs differ (one is 0 and the other is 1).' },

{ topicId:T.BOOL, difficulty:'MEDIUM', isPreviousYear:true,
  question:'NAND gate is called a "universal gate" because:',
  options:[{content:'Any logic circuit can be implemented using only NAND gates',isCorrect:true},{content:'It is the fastest gate',isCorrect:false},{content:'It uses the least power',isCorrect:false},{content:'It has the most inputs',isCorrect:false}],
  explanation:'NAND (and NOR) are universal gates because any Boolean function can be implemented using only NAND gates.' },

{ topicId:T.BOOL, difficulty:'MEDIUM', isPreviousYear:false,
  question:'What is the dual of Boolean expression A + 1 = 1?',
  options:[{content:'A · 0 = 0',isCorrect:true},{content:'A + 0 = A',isCorrect:false},{content:"A · 1 = A'",isCorrect:false},{content:'A + A = 1',isCorrect:false}],
  explanation:'The dual is obtained by replacing + with ·, · with +, 0 with 1, and 1 with 0: A+1=1 becomes A·0=0.' },

{ topicId:T.BOOL, difficulty:'HARD', isPreviousYear:true,
  question:'How many 2-input NAND gates are needed to implement a 2-input AND gate?',
  options:[{content:'2',isCorrect:true},{content:'1',isCorrect:false},{content:'3',isCorrect:false},{content:'4',isCorrect:false}],
  explanation:'AND = NAND followed by NOT. NOT using NAND = 1 gate (both inputs tied). AND = 2 NAND gates total.' },

{ topicId:T.BOOL, difficulty:'HARD', isPreviousYear:false,
  question:'The minterm for variables A, B, C when A=1, B=0, C=1 is:',
  options:[{content:"AB'C",isCorrect:true},{content:"A'BC",isCorrect:false},{content:'ABC',isCorrect:false},{content:"AB'C'",isCorrect:false}],
  explanation:"Minterm uses complemented variable when value is 0. A=1→A, B=0→B', C=1→C. Minterm = AB'C." },

{ topicId:T.BOOL, difficulty:'HARD', isPreviousYear:true,
  question:'Simplify using Boolean algebra: A·B + A·B\'',
  options:[{content:'A',isCorrect:true},{content:'B',isCorrect:false},{content:'A+B',isCorrect:false},{content:'AB',isCorrect:false}],
  explanation:'A·B + A·B\' = A·(B + B\') = A·1 = A (distributive law and complement law).' },

{ topicId:T.BOOL, difficulty:'HARD', isPreviousYear:false,
  question:'A half-adder has:',
  options:[{content:'2 inputs and 2 outputs (sum and carry)',isCorrect:true},{content:'3 inputs and 2 outputs',isCorrect:false},{content:'2 inputs and 1 output',isCorrect:false},{content:'3 inputs and 3 outputs',isCorrect:false}],
  explanation:'Half-adder: inputs A, B; outputs Sum = A XOR B, Carry = A AND B. Cannot handle carry-in.' },

{ topicId:T.BOOL, difficulty:'EXPERT', isPreviousYear:true,
  question:'The Boolean function F = Σ(1,3,5,7) with variables A,B,C can be minimized to:',
  options:[{content:'C',isCorrect:true},{content:'A+B+C',isCorrect:false},{content:'ABC',isCorrect:false},{content:'A\'B\'C + ...',isCorrect:false}],
  explanation:'Minterms 1,3,5,7 correspond to all combinations where C=1. Simplified expression: F = C.' },

{ topicId:T.BOOL, difficulty:'EXPERT', isPreviousYear:false,
  question:'Which of the following expressions is equivalent to A XOR B XOR C?',
  options:[{content:'Odd number of 1s among A, B, C → output 1',isCorrect:true},{content:'All inputs equal → output 1',isCorrect:false},{content:'At least one input is 1 → output 1',isCorrect:false},{content:'All inputs are 1 → output 1',isCorrect:false}],
  explanation:'XOR of multiple bits is 1 when an odd number of inputs are 1 (parity check).' },

{ topicId:T.BOOL, difficulty:'EXPERT', isPreviousYear:true,
  question:'How many rows are in the truth table of a 4-variable Boolean function?',
  options:[{content:'16',isCorrect:true},{content:'8',isCorrect:false},{content:'12',isCorrect:false},{content:'32',isCorrect:false}],
  explanation:'A truth table with n variables has 2^n rows. For 4 variables: 2^4 = 16 rows.' },

// ─── COMPUTER ORGANIZATION & ARCHITECTURE (15) ───────────────────────────────
{ topicId:T.ARCH, difficulty:'EASY', isPreviousYear:false,
  question:'Which part of the CPU performs arithmetic and logical operations?',
  options:[{content:'ALU',isCorrect:true},{content:'Control Unit',isCorrect:false},{content:'Register',isCorrect:false},{content:'Cache',isCorrect:false}],
  explanation:'The ALU (Arithmetic Logic Unit) performs all arithmetic (+,-,×,÷) and logical (AND, OR, NOT) operations.' },

{ topicId:T.ARCH, difficulty:'EASY', isPreviousYear:true,
  question:'Program Counter (PC) holds:',
  options:[{content:'The address of the next instruction to be executed',isCorrect:true},{content:'The result of the last operation',isCorrect:false},{content:'The current instruction being executed',isCorrect:false},{content:'The stack pointer',isCorrect:false}],
  explanation:'The Program Counter (PC) always contains the memory address of the next instruction to fetch.' },

{ topicId:T.ARCH, difficulty:'MEDIUM', isPreviousYear:true,
  question:'RISC processors are characterized by:',
  options:[{content:'Fixed-length, simple instructions that execute in one clock cycle',isCorrect:true},{content:'Complex instructions that can perform multiple operations',isCorrect:false},{content:'Variable-length instructions',isCorrect:false},{content:'No registers — only memory operations',isCorrect:false}],
  explanation:'RISC (Reduced Instruction Set Computer) uses simple, uniform instructions each completing in one cycle.' },

{ topicId:T.ARCH, difficulty:'MEDIUM', isPreviousYear:false,
  question:'In a direct addressing mode, the operand is:',
  options:[{content:'The actual memory address of the data',isCorrect:true},{content:'The data itself',isCorrect:false},{content:'A pointer to a pointer',isCorrect:false},{content:'An offset from the base register',isCorrect:false}],
  explanation:'Direct addressing: the address field in the instruction directly gives the memory address of the operand.' },

{ topicId:T.ARCH, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Pipelining improves CPU performance by:',
  options:[{content:'Overlapping execution of multiple instructions',isCorrect:true},{content:'Using faster clock speeds only',isCorrect:false},{content:'Reducing the number of instructions',isCorrect:false},{content:'Adding more ALUs',isCorrect:false}],
  explanation:'Pipelining divides instruction execution into stages and processes multiple instructions simultaneously in different stages.' },

{ topicId:T.ARCH, difficulty:'MEDIUM', isPreviousYear:false,
  question:'The instruction cycle consists of:',
  options:[{content:'Fetch, Decode, Execute',isCorrect:true},{content:'Load, Store, Execute',isCorrect:false},{content:'Read, Write, Process',isCorrect:false},{content:'Input, Process, Output',isCorrect:false}],
  explanation:'The basic instruction cycle: Fetch instruction from memory → Decode it → Execute it.' },

{ topicId:T.ARCH, difficulty:'HARD', isPreviousYear:true,
  question:'A cache hit ratio of 0.9 means:',
  options:[{content:'90% of memory accesses are served from cache',isCorrect:true},{content:'Cache is 90% full',isCorrect:false},{content:'Cache is 10% faster than RAM',isCorrect:false},{content:'90% of data is cached permanently',isCorrect:false}],
  explanation:'Cache hit ratio = hits / total accesses. 0.9 means 90% of accesses found data in cache (faster access).' },

{ topicId:T.ARCH, difficulty:'HARD', isPreviousYear:false,
  question:'Effective memory access time = 10% cache miss rate, cache access = 10ns, main memory = 100ns. Effective time is:',
  options:[{content:'19 ns',isCorrect:true},{content:'55 ns',isCorrect:false},{content:'10 ns',isCorrect:false},{content:'100 ns',isCorrect:false}],
  explanation:'EAT = h×Tc + (1-h)×Tm = 0.9×10 + 0.1×100 = 9 + 10 = 19 ns.' },

{ topicId:T.ARCH, difficulty:'HARD', isPreviousYear:true,
  question:'Which of the following is a non-volatile memory?',
  options:[{content:'ROM',isCorrect:true},{content:'DRAM',isCorrect:false},{content:'SRAM',isCorrect:false},{content:'Cache',isCorrect:false}],
  explanation:'ROM (Read-Only Memory) retains data without power (non-volatile). DRAM and SRAM are volatile.' },

{ topicId:T.ARCH, difficulty:'EXPERT', isPreviousYear:false,
  question:'In a 4-stage pipeline with stages each taking 1 ns, the throughput for 10 instructions is:',
  options:[{content:'Approximately 10/13 instructions per ns',isCorrect:true},{content:'10/40 instructions per ns',isCorrect:false},{content:'1 instruction per ns',isCorrect:false},{content:'10/4 instructions per ns',isCorrect:false}],
  explanation:'Pipeline time = (k + n - 1) cycles = 4 + 10 - 1 = 13 cycles. Throughput = n/((k+n-1)×t) = 10/13 per ns.' },

{ topicId:T.ARCH, difficulty:'EXPERT', isPreviousYear:true,
  question:'Amdahl\'s law states that the speedup of a program using parallel processors is limited by:',
  options:[{content:'The sequential (non-parallelizable) fraction of the program',isCorrect:true},{content:'The number of processors available',isCorrect:false},{content:'The memory bandwidth',isCorrect:false},{content:'The clock speed of each processor',isCorrect:false}],
  explanation:"Amdahl's Law: Speedup ≤ 1/(s + (1-s)/p) where s is the sequential fraction. Even infinite processors can't speedup the serial part." },

{ topicId:T.ARCH, difficulty:'EASY', isPreviousYear:true,
  question:'Which register holds the instruction currently being decoded/executed?',
  options:[{content:'Instruction Register (IR)',isCorrect:true},{content:'Program Counter (PC)',isCorrect:false},{content:'Memory Address Register (MAR)',isCorrect:false},{content:'Accumulator',isCorrect:false}],
  explanation:'The Instruction Register (IR) holds the instruction that has been fetched and is being decoded/executed.' },

{ topicId:T.ARCH, difficulty:'MEDIUM', isPreviousYear:false,
  question:'DMA (Direct Memory Access) is used to:',
  options:[{content:'Allow I/O devices to transfer data directly to/from memory without CPU intervention',isCorrect:true},{content:'Speed up CPU arithmetic operations',isCorrect:false},{content:'Manage virtual memory',isCorrect:false},{content:'Cache frequently accessed instructions',isCorrect:false}],
  explanation:'DMA controller allows peripherals to transfer data directly to/from main memory, freeing the CPU for other tasks.' },

{ topicId:T.ARCH, difficulty:'HARD', isPreviousYear:false,
  question:'In a fully-associative cache, a block can be placed:',
  options:[{content:'In any cache line',isCorrect:true},{content:'In exactly one cache line',isCorrect:false},{content:'In a fixed set of lines',isCorrect:false},{content:'Only in the first available line',isCorrect:false}],
  explanation:'Fully-associative mapping allows a memory block to be stored in any cache line, giving maximum flexibility.' },

{ topicId:T.ARCH, difficulty:'EXPERT', isPreviousYear:true,
  question:'Which interrupt handling method has the highest overhead but offers most flexibility?',
  options:[{content:'Software polling',isCorrect:true},{content:'Vectored interrupts',isCorrect:false},{content:'DMA',isCorrect:false},{content:'Non-maskable interrupts',isCorrect:false}],
  explanation:'Software polling requires the CPU to repeatedly check each device for interrupt requests — simple but wastes CPU cycles.' },

// ─── CYBER SECURITY (15) ─────────────────────────────────────────────────────
{ topicId:T.CYBER, difficulty:'EASY', isPreviousYear:false,
  question:'What does SSL stand for?',
  options:[{content:'Secure Sockets Layer',isCorrect:true},{content:'System Security Layer',isCorrect:false},{content:'Safe Sockets Link',isCorrect:false},{content:'Secure System Link',isCorrect:false}],
  explanation:'SSL (Secure Sockets Layer) is a protocol for establishing encrypted links between a web server and a browser.' },

{ topicId:T.CYBER, difficulty:'EASY', isPreviousYear:true,
  question:'Which of the following is a type of malware that replicates itself?',
  options:[{content:'Virus',isCorrect:true},{content:'Firewall',isCorrect:false},{content:'Antivirus',isCorrect:false},{content:'Cookie',isCorrect:false}],
  explanation:'A computer virus is malware that replicates by attaching itself to other programs.' },

{ topicId:T.CYBER, difficulty:'EASY', isPreviousYear:false,
  question:'Phishing is a type of attack that:',
  options:[{content:'Tricks users into revealing sensitive information via fake communications',isCorrect:true},{content:'Physically steals hardware',isCorrect:false},{content:'Slows down network traffic',isCorrect:false},{content:'Encrypts files for ransom',isCorrect:false}],
  explanation:'Phishing uses fraudulent emails/websites to deceive users into providing passwords, credit card numbers, etc.' },

{ topicId:T.CYBER, difficulty:'MEDIUM', isPreviousYear:true,
  question:'A firewall is used to:',
  options:[{content:'Monitor and control incoming/outgoing network traffic based on rules',isCorrect:true},{content:'Speed up internet connections',isCorrect:false},{content:'Encrypt hard disk data',isCorrect:false},{content:'Prevent physical access to computers',isCorrect:false}],
  explanation:'A firewall filters network traffic to allow or block data packets based on security rules.' },

{ topicId:T.CYBER, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Which encryption standard uses a 128-bit key and is widely used today?',
  options:[{content:'AES (Advanced Encryption Standard)',isCorrect:true},{content:'DES (Data Encryption Standard)',isCorrect:false},{content:'MD5',isCorrect:false},{content:'RSA',isCorrect:false}],
  explanation:'AES supports 128, 192, or 256-bit keys and is the current U.S. government encryption standard.' },

{ topicId:T.CYBER, difficulty:'MEDIUM', isPreviousYear:true,
  question:'In public-key cryptography, the key used for encryption is:',
  options:[{content:'The recipient\'s public key',isCorrect:true},{content:'The sender\'s private key',isCorrect:false},{content:'A shared secret key',isCorrect:false},{content:'The recipient\'s private key',isCorrect:false}],
  explanation:'In asymmetric encryption: sender encrypts with recipient\'s PUBLIC key; only recipient\'s PRIVATE key can decrypt.' },

{ topicId:T.CYBER, difficulty:'MEDIUM', isPreviousYear:false,
  question:'What is a DDoS attack?',
  options:[{content:'Overwhelming a server with traffic from multiple sources to deny service',isCorrect:true},{content:'Decrypting data without authorization',isCorrect:false},{content:'Stealing a user\'s identity online',isCorrect:false},{content:'Installing spyware on a system',isCorrect:false}],
  explanation:'DDoS (Distributed Denial of Service) uses many compromised systems to flood a target with traffic, making it unavailable.' },

{ topicId:T.CYBER, difficulty:'HARD', isPreviousYear:true,
  question:'A digital signature provides:',
  options:[{content:'Authentication and non-repudiation',isCorrect:true},{content:'Data encryption only',isCorrect:false},{content:'Physical security',isCorrect:false},{content:'Faster data transmission',isCorrect:false}],
  explanation:'Digital signatures verify the sender\'s identity (authentication) and prevent denial of having sent the message (non-repudiation).' },

{ topicId:T.CYBER, difficulty:'HARD', isPreviousYear:false,
  question:'Which hashing algorithm produces a 256-bit hash value?',
  options:[{content:'SHA-256',isCorrect:true},{content:'MD5',isCorrect:false},{content:'SHA-1',isCorrect:false},{content:'DES',isCorrect:false}],
  explanation:'SHA-256 (Secure Hash Algorithm) produces a 256-bit (32-byte) hash. MD5=128-bit, SHA-1=160-bit.' },

{ topicId:T.CYBER, difficulty:'HARD', isPreviousYear:true,
  question:'SQL injection attacks target:',
  options:[{content:'Web applications that pass unsanitized user input to a database',isCorrect:true},{content:'Network routers',isCorrect:false},{content:'Email servers only',isCorrect:false},{content:'Physical hardware components',isCorrect:false}],
  explanation:'SQL injection inserts malicious SQL code into input fields to manipulate database queries.' },

{ topicId:T.CYBER, difficulty:'HARD', isPreviousYear:false,
  question:'Which of the following is a symmetric encryption algorithm?',
  options:[{content:'AES',isCorrect:true},{content:'RSA',isCorrect:false},{content:'Diffie-Hellman',isCorrect:false},{content:'ECC',isCorrect:false}],
  explanation:'AES is symmetric (same key for encryption and decryption). RSA, Diffie-Hellman, ECC are asymmetric.' },

{ topicId:T.CYBER, difficulty:'EXPERT', isPreviousYear:true,
  question:'A man-in-the-middle (MITM) attack intercepts:',
  options:[{content:'Communication between two parties without their knowledge',isCorrect:true},{content:'Only outgoing network packets',isCorrect:false},{content:'Only encrypted traffic',isCorrect:false},{content:'Physical hardware components',isCorrect:false}],
  explanation:'MITM attacks secretly intercept and possibly alter communications between two parties who believe they are communicating directly.' },

{ topicId:T.CYBER, difficulty:'EXPERT', isPreviousYear:false,
  question:'Zero-day vulnerability refers to:',
  options:[{content:'A security flaw unknown to the vendor with no patch available',isCorrect:true},{content:'A vulnerability fixed within 24 hours',isCorrect:false},{content:'A newly discovered virus',isCorrect:false},{content:'An attack that causes zero damage',isCorrect:false}],
  explanation:'A zero-day vulnerability is an unknown flaw that developers have "zero days" to fix before it can be exploited.' },

{ topicId:T.CYBER, difficulty:'EASY', isPreviousYear:false,
  question:'HTTPS differs from HTTP by:',
  options:[{content:'Adding SSL/TLS encryption for secure communication',isCorrect:true},{content:'Being faster than HTTP',isCorrect:false},{content:'Supporting more file types',isCorrect:false},{content:'Using a different port 80',isCorrect:false}],
  explanation:'HTTPS = HTTP + SSL/TLS encryption. It uses port 443 instead of port 80.' },

{ topicId:T.CYBER, difficulty:'MEDIUM', isPreviousYear:true,
  question:'A trojan horse in computing is:',
  options:[{content:'Malware disguised as legitimate software',isCorrect:true},{content:'A type of firewall',isCorrect:false},{content:'A fast encryption algorithm',isCorrect:false},{content:'A network monitoring tool',isCorrect:false}],
  explanation:'A Trojan horse appears to be legitimate software but contains malicious code that executes when run.' },

// ─── DATA STRUCTURES (15) ────────────────────────────────────────────────────
{ topicId:T.DS, difficulty:'EASY', isPreviousYear:true,
  question:'Which data structure follows the LIFO (Last In First Out) principle?',
  options:[{content:'Stack',isCorrect:true},{content:'Queue',isCorrect:false},{content:'Array',isCorrect:false},{content:'Linked List',isCorrect:false}],
  explanation:'Stack follows LIFO: the last element pushed is the first one popped.' },

{ topicId:T.DS, difficulty:'EASY', isPreviousYear:false,
  question:'Which data structure follows the FIFO (First In First Out) principle?',
  options:[{content:'Queue',isCorrect:true},{content:'Stack',isCorrect:false},{content:'Tree',isCorrect:false},{content:'Graph',isCorrect:false}],
  explanation:'Queue follows FIFO: the first element enqueued is the first one dequeued.' },

{ topicId:T.DS, difficulty:'EASY', isPreviousYear:true,
  question:'The time complexity of accessing an element in an array by index is:',
  options:[{content:'O(1)',isCorrect:true},{content:'O(n)',isCorrect:false},{content:'O(log n)',isCorrect:false},{content:'O(n²)',isCorrect:false}],
  explanation:'Array index access is O(1) — constant time since the address is computed directly.' },

{ topicId:T.DS, difficulty:'MEDIUM', isPreviousYear:true,
  question:'In a binary search tree (BST), the in-order traversal gives:',
  options:[{content:'Elements in sorted (ascending) order',isCorrect:true},{content:'Elements in reverse order',isCorrect:false},{content:'Level-by-level elements',isCorrect:false},{content:'Random order',isCorrect:false}],
  explanation:'In-order traversal of a BST visits nodes in Left-Root-Right order, producing sorted ascending output.' },

{ topicId:T.DS, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Which of the following is NOT a property of a Binary Search Tree?',
  options:[{content:'All levels must be completely filled',isCorrect:true},{content:'Left subtree contains nodes smaller than root',isCorrect:false},{content:'Right subtree contains nodes larger than root',isCorrect:false},{content:'No duplicate values',isCorrect:false}],
  explanation:'BST does NOT require all levels to be filled. A complete/full binary tree has that property.' },

{ topicId:T.DS, difficulty:'MEDIUM', isPreviousYear:true,
  question:'What is the maximum number of nodes in a binary tree of height h?',
  options:[{content:'2^(h+1) - 1',isCorrect:true},{content:'2^h',isCorrect:false},{content:'h²',isCorrect:false},{content:'2h+1',isCorrect:false}],
  explanation:'Maximum nodes in a complete binary tree of height h (root at h=0): 2^0 + 2^1 + ... + 2^h = 2^(h+1) - 1.' },

{ topicId:T.DS, difficulty:'MEDIUM', isPreviousYear:false,
  question:'A linked list is preferred over an array when:',
  options:[{content:'Frequent insertions and deletions are required',isCorrect:true},{content:'Random access is needed',isCorrect:false},{content:'Memory is limited',isCorrect:false},{content:'Sorting is the primary operation',isCorrect:false}],
  explanation:'Linked lists allow O(1) insertion/deletion (after finding position) without shifting elements, unlike arrays.' },

{ topicId:T.DS, difficulty:'HARD', isPreviousYear:true,
  question:'The height of a balanced binary search tree with n nodes is:',
  options:[{content:'O(log n)',isCorrect:true},{content:'O(n)',isCorrect:false},{content:'O(n log n)',isCorrect:false},{content:'O(1)',isCorrect:false}],
  explanation:'A balanced BST (AVL, Red-Black tree) maintains height O(log n) for efficient search.' },

{ topicId:T.DS, difficulty:'HARD', isPreviousYear:false,
  question:'Which traversal of a binary tree is used to get a prefix expression (Polish notation)?',
  options:[{content:'Pre-order (Root-Left-Right)',isCorrect:true},{content:'In-order (Left-Root-Right)',isCorrect:false},{content:'Post-order (Left-Right-Root)',isCorrect:false},{content:'Level-order',isCorrect:false}],
  explanation:'Pre-order traversal produces prefix notation. Post-order produces postfix (Reverse Polish) notation.' },

{ topicId:T.DS, difficulty:'HARD', isPreviousYear:true,
  question:'A min-heap guarantees that:',
  options:[{content:'The parent node is always smaller than its children',isCorrect:true},{content:'The tree is always a BST',isCorrect:false},{content:'Left child is smaller than right child',isCorrect:false},{content:'The root has the largest value',isCorrect:false}],
  explanation:'In a min-heap, every parent node is ≤ its children, so the root is always the minimum element.' },

{ topicId:T.DS, difficulty:'HARD', isPreviousYear:false,
  question:'The time complexity of inserting into a hash table (average case) is:',
  options:[{content:'O(1)',isCorrect:true},{content:'O(log n)',isCorrect:false},{content:'O(n)',isCorrect:false},{content:'O(n log n)',isCorrect:false}],
  explanation:'Average case hash table insertion is O(1) — compute hash and insert. Worst case is O(n) due to collisions.' },

{ topicId:T.DS, difficulty:'EXPERT', isPreviousYear:true,
  question:'In a graph with V vertices and E edges, Dijkstra\'s algorithm has time complexity (with binary heap):',
  options:[{content:'O((V + E) log V)',isCorrect:true},{content:'O(V²)',isCorrect:false},{content:'O(VE)',isCorrect:false},{content:'O(E log E)',isCorrect:false}],
  explanation:'Dijkstra with a binary min-heap: O((V + E) log V). With an adjacency matrix: O(V²).' },

{ topicId:T.DS, difficulty:'EXPERT', isPreviousYear:false,
  question:'Which data structure is most suitable for implementing a priority queue?',
  options:[{content:'Heap',isCorrect:true},{content:'Stack',isCorrect:false},{content:'Array (unsorted)',isCorrect:false},{content:'Linked List (unsorted)',isCorrect:false}],
  explanation:'A heap (min or max) provides O(log n) insert and O(1) peek for priority queue operations.' },

{ topicId:T.DS, difficulty:'EXPERT', isPreviousYear:true,
  question:'In a circular queue with MAX size 5, if front = 2 and rear = 1, how many elements are present?',
  options:[{content:'4',isCorrect:true},{content:'3',isCorrect:false},{content:'2',isCorrect:false},{content:'Cannot determine',isCorrect:false}],
  explanation:'In a circular queue: count = (rear - front + MAX) % MAX = (1 - 2 + 5) % 5 = 4.' },

{ topicId:T.DS, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Which of the following graph representations is most space-efficient for sparse graphs?',
  options:[{content:'Adjacency List',isCorrect:true},{content:'Adjacency Matrix',isCorrect:false},{content:'Incidence Matrix',isCorrect:false},{content:'Edge List with matrix',isCorrect:false}],
  explanation:'Adjacency list uses O(V+E) space vs O(V²) for adjacency matrix — much better for sparse graphs (few edges).' },

// ─── COMPUTER NETWORKS (15) ──────────────────────────────────────────────────
{ topicId:T.NETS, difficulty:'EASY', isPreviousYear:true,
  question:'Which topology connects all devices to a single central hub?',
  options:[{content:'Star',isCorrect:true},{content:'Bus',isCorrect:false},{content:'Ring',isCorrect:false},{content:'Mesh',isCorrect:false}],
  explanation:'Star topology: all nodes connect to a central hub/switch. Single point of failure at the hub.' },

{ topicId:T.NETS, difficulty:'EASY', isPreviousYear:false,
  question:'Which protocol is used to assign IP addresses automatically?',
  options:[{content:'DHCP',isCorrect:true},{content:'DNS',isCorrect:false},{content:'FTP',isCorrect:false},{content:'SMTP',isCorrect:false}],
  explanation:'DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses to network devices.' },

{ topicId:T.NETS, difficulty:'EASY', isPreviousYear:true,
  question:'What is the full form of IP in networking?',
  options:[{content:'Internet Protocol',isCorrect:true},{content:'Internal Protocol',isCorrect:false},{content:'Interconnect Protocol',isCorrect:false},{content:'Internet Port',isCorrect:false}],
  explanation:'IP stands for Internet Protocol — provides logical addressing for routing packets across networks.' },

{ topicId:T.NETS, difficulty:'MEDIUM', isPreviousYear:true,
  question:'An IPv4 address is how many bits long?',
  options:[{content:'32 bits',isCorrect:true},{content:'64 bits',isCorrect:false},{content:'128 bits',isCorrect:false},{content:'16 bits',isCorrect:false}],
  explanation:'IPv4 uses 32-bit addresses (written as four octets, e.g., 192.168.1.1). IPv6 uses 128 bits.' },

{ topicId:T.NETS, difficulty:'MEDIUM', isPreviousYear:false,
  question:'Which device operates at the Network layer of the OSI model?',
  options:[{content:'Router',isCorrect:true},{content:'Switch',isCorrect:false},{content:'Hub',isCorrect:false},{content:'Repeater',isCorrect:false}],
  explanation:'Router operates at Layer 3 (Network). Switch at Layer 2. Hub and Repeater at Layer 1.' },

{ topicId:T.NETS, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Which protocol is responsible for translating domain names to IP addresses?',
  options:[{content:'DNS',isCorrect:true},{content:'DHCP',isCorrect:false},{content:'ARP',isCorrect:false},{content:'ICMP',isCorrect:false}],
  explanation:'DNS (Domain Name System) resolves human-readable domain names (www.example.com) to IP addresses.' },

{ topicId:T.NETS, difficulty:'MEDIUM', isPreviousYear:false,
  question:'TCP differs from UDP in that TCP:',
  options:[{content:'Is connection-oriented and guarantees delivery',isCorrect:true},{content:'Is faster and used for streaming',isCorrect:false},{content:'Does not establish a connection before sending data',isCorrect:false},{content:'Uses less bandwidth',isCorrect:false}],
  explanation:'TCP establishes a connection (3-way handshake), ensures reliable, ordered delivery. UDP is connectionless and unreliable but faster.' },

{ topicId:T.NETS, difficulty:'HARD', isPreviousYear:true,
  question:'Class C IP addresses support how many hosts per network?',
  options:[{content:'254',isCorrect:true},{content:'256',isCorrect:false},{content:'65534',isCorrect:false},{content:'16 million',isCorrect:false}],
  explanation:'Class C: 8-bit host part → 2^8 - 2 = 254 hosts (subtracting network and broadcast addresses).' },

{ topicId:T.NETS, difficulty:'HARD', isPreviousYear:false,
  question:'The subnet mask 255.255.255.0 corresponds to which CIDR notation?',
  options:[{content:'/24',isCorrect:true},{content:'/8',isCorrect:false},{content:'/16',isCorrect:false},{content:'/32',isCorrect:false}],
  explanation:'255.255.255.0 = 24 consecutive 1-bits in binary → /24 in CIDR notation.' },

{ topicId:T.NETS, difficulty:'HARD', isPreviousYear:true,
  question:'ARP (Address Resolution Protocol) is used to:',
  options:[{content:'Map IP addresses to MAC addresses',isCorrect:true},{content:'Map MAC addresses to IP addresses',isCorrect:false},{content:'Resolve domain names',isCorrect:false},{content:'Assign IP addresses dynamically',isCorrect:false}],
  explanation:'ARP resolves an IP address to the corresponding MAC (physical) address on a local network.' },

{ topicId:T.NETS, difficulty:'HARD', isPreviousYear:false,
  question:'Which of the following is a private IP address range?',
  options:[{content:'192.168.0.0 to 192.168.255.255',isCorrect:true},{content:'8.8.8.0 to 8.8.8.255',isCorrect:false},{content:'172.32.0.0 to 172.63.255.255',isCorrect:false},{content:'10.0.0.0 to 10.127.255.255 only',isCorrect:false}],
  explanation:'Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. 192.168.x.x is the most common private range.' },

{ topicId:T.NETS, difficulty:'EXPERT', isPreviousYear:true,
  question:'In CSMA/CD, when a collision is detected, stations:',
  options:[{content:'Stop transmitting, wait a random backoff time, then retry',isCorrect:true},{content:'Immediately retransmit at higher priority',isCorrect:false},{content:'Discard the frame permanently',isCorrect:false},{content:'Switch to a different channel',isCorrect:false}],
  explanation:'CSMA/CD: on collision, all stations stop, send jam signal, wait random exponential backoff, then retry.' },

{ topicId:T.NETS, difficulty:'EXPERT', isPreviousYear:false,
  question:'What is the purpose of NAT (Network Address Translation)?',
  options:[{content:'Allow multiple devices to share a single public IP address',isCorrect:true},{content:'Translate domain names to IPs',isCorrect:false},{content:'Encrypt network traffic',isCorrect:false},{content:'Filter malicious packets',isCorrect:false}],
  explanation:'NAT maps multiple private IP addresses to one (or few) public IP addresses, conserving IPv4 address space.' },

{ topicId:T.NETS, difficulty:'EASY', isPreviousYear:false,
  question:'A WAN (Wide Area Network) spans:',
  options:[{content:'A large geographical area such as a country or continent',isCorrect:true},{content:'A single building or campus',isCorrect:false},{content:'A single room',isCorrect:false},{content:'Only wireless connections',isCorrect:false}],
  explanation:'WAN covers large geographic areas. LAN covers a building; MAN covers a city; WAN covers countries/continents.' },

{ topicId:T.NETS, difficulty:'MEDIUM', isPreviousYear:true,
  question:'Which layer of the OSI model handles logical addressing and routing?',
  options:[{content:'Network Layer (Layer 3)',isCorrect:true},{content:'Data Link Layer (Layer 2)',isCorrect:false},{content:'Transport Layer (Layer 4)',isCorrect:false},{content:'Physical Layer (Layer 1)',isCorrect:false}],
  explanation:'Layer 3 (Network) handles logical addressing (IP) and routing. Routers operate at this layer.' },

];

// ─── Runner ───────────────────────────────────────────────────────────────────
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
  console.log(`\nPart 1 — Computer Awareness (${MCQS.length} MCQs: Fundamentals, Number Systems, Boolean Algebra, Architecture, Cyber Security, Data Structures)\n`);
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
