/** GATE-CSE-exclusive subjects — combined with shared-subjects' engineeringMathematics
 * and digitalLogic (both standardized across GATE papers) in scripts/seed/exams/gate-cse.ts. */
import type { NodeDef } from '../lib/upsert';

export const gateCseSubjects: NodeDef[] = [
  {
    name: 'Discrete Mathematics',
    children: [
      { name: 'Set Theory and Relations', children: [{ name: 'Sets and Functions' }, { name: 'Relations and Partial Orders' }] },
      { name: 'Combinatorics', children: [{ name: 'Counting Principles' }, { name: 'Recurrence Relations' }] },
      {
        name: 'Graph Theory',
        children: [{ name: 'Graph Basics' }, { name: 'Trees and Spanning Trees' }, { name: 'Graph Coloring' }],
      },
      { name: 'Mathematical Logic', children: [{ name: 'Propositional Logic' }, { name: 'Predicate Logic' }] },
    ],
  },
  {
    name: 'Computer Organization and Architecture',
    children: [
      { name: 'Machine Instructions and Addressing Modes' },
      { name: 'Pipelining', children: [{ name: 'Pipeline Hazards' }, { name: 'Pipeline Performance' }] },
      { name: 'Memory Hierarchy', children: [{ name: 'Cache Memory' }, { name: 'Virtual Memory' }] },
      { name: 'Input Output Interface', children: [{ name: 'Interrupts' }, { name: 'DMA' }] },
    ],
  },
  {
    name: 'Programming and Data Structures',
    children: [
      { name: 'Programming in C', children: [{ name: 'Control Structures' }, { name: 'Functions and Recursion' }, { name: 'Pointers' }] },
      { name: 'Arrays and Strings' },
      { name: 'Linked Lists', children: [{ name: 'Singly Linked Lists' }, { name: 'Doubly Linked Lists' }] },
      { name: 'Stacks and Queues' },
      { name: 'Trees and Graphs', children: [{ name: 'Binary Trees' }, { name: 'Binary Search Trees' }, { name: 'Graph Representations' }] },
    ],
  },
  {
    name: 'Algorithms',
    children: [
      { name: 'Asymptotic Analysis', children: [{ name: 'Time Complexity' }, { name: 'Space Complexity' }] },
      { name: 'Sorting Algorithms', children: [{ name: 'Comparison Based Sorting' }, { name: 'Linear Time Sorting' }] },
      { name: 'Searching Algorithms' },
      { name: 'Greedy and Dynamic Programming', children: [{ name: 'Greedy Technique' }, { name: 'Dynamic Programming Technique' }] },
      { name: 'Graph Algorithms', children: [{ name: 'Shortest Path Algorithms' }, { name: 'Minimum Spanning Tree' }] },
    ],
  },
  {
    name: 'Theory of Computation',
    children: [
      { name: 'Regular Languages and Finite Automata' },
      { name: 'Context Free Languages and Pushdown Automata' },
      { name: 'Turing Machines' },
      { name: 'Undecidability' },
    ],
  },
  {
    name: 'Compiler Design',
    children: [
      { name: 'Lexical Analysis' },
      { name: 'Parsing Techniques' },
      { name: 'Syntax Directed Translation' },
      { name: 'Code Generation and Optimization' },
    ],
  },
  {
    name: 'Operating System',
    children: [
      { name: 'Processes and Threads' },
      { name: 'Process Synchronization', children: [{ name: 'Mutual Exclusion' }, { name: 'Semaphores and Monitors' }] },
      { name: 'Memory Management', children: [{ name: 'Paging and Segmentation' }, { name: 'Page Replacement Algorithms' }] },
      { name: 'File Systems' },
    ],
  },
  {
    name: 'Databases',
    children: [
      { name: 'ER Model and Relational Model' },
      { name: 'Relational Algebra and SQL' },
      { name: 'Normalization', children: [{ name: 'Functional Dependencies' }, { name: 'Normal Forms' }] },
      { name: 'Transactions and Concurrency Control' },
    ],
  },
  {
    name: 'Computer Networks',
    children: [
      { name: 'OSI and TCP/IP Reference Models' },
      { name: 'Data Link Layer', children: [{ name: 'Error Detection and Correction' }, { name: 'Medium Access Control' }] },
      { name: 'Network Layer', children: [{ name: 'IP Addressing' }, { name: 'Routing Algorithms' }] },
      { name: 'Transport Layer', children: [{ name: 'TCP and UDP' }, { name: 'Congestion Control' }] },
    ],
  },
];
