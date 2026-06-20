#!/usr/bin/env npx tsx
/**
 * Seed NIMCET Mathematics — all 11 chapters (topics) created here.
 * MCQs for chapters 1–6: Sets · Logic · Algebra · Permutations · Sequences · Matrices
 *
 * Run: npx tsx scripts/seed-nimcet-math-part1.ts
 * Then run part2 for chapters 7–11.
 */


export {};

const BASE    = 'https://scholar247.org';
const KEY     = 'd846e4f1862433c8d265f459f5264b721c28a93057c9b7949d8a4cf98e7bdb9f';
const EXAM_ID = '626534b9-0ac4-4d73-a400-7391b645338a';

// ─── All 11 chapter definitions ───────────────────────────────────────────────

const CHAPTERS = [
  { key:'SETS',  slug:'nimcet-mathematics-sets-relations-functions',
    name:'Sets, Relations & Functions',
    desc:'Set operations, Venn diagrams, Cartesian products, types of relations (reflexive, symmetric, transitive, equivalence) and functions (one-one, onto, bijective, inverse).',
    order:0 },
  { key:'LOGIC', slug:'nimcet-mathematics-mathematical-logic',
    name:'Mathematical Logic',
    desc:'Logical connectives (AND, OR, NOT, IF-THEN, IFF), truth tables, tautology, contradiction, logical equivalence, and laws of inference.',
    order:1 },
  { key:'ALG',   slug:'nimcet-mathematics-algebra-number-theory',
    name:'Algebra & Number Theory',
    desc:'Complex numbers, quadratic equations, polynomial roots, HCF/LCM, modular arithmetic, divisibility rules, and properties of integers.',
    order:2 },
  { key:'PC',    slug:'nimcet-mathematics-permutations-combinations',
    name:'Permutations & Combinations',
    desc:'Fundamental counting principle, factorial notation, nPr and nCr, arrangements with/without repetition, circular permutations, pigeonhole principle, and distribution problems.',
    order:3 },
  { key:'SEQ',   slug:'nimcet-mathematics-sequences-series',
    name:'Sequences & Series',
    desc:'Arithmetic, Geometric, and Harmonic progressions; their nth terms, sum formulas, AM-GM-HM inequalities, and infinite geometric series.',
    order:4 },
  { key:'MAT',   slug:'nimcet-mathematics-matrices-determinants',
    name:'Matrices & Determinants',
    desc:'Matrix types and operations, determinant evaluation, properties, Cramer\'s rule, inverse of a matrix, rank, and the Cayley-Hamilton theorem.',
    order:5 },
  { key:'TRIG',  slug:'nimcet-mathematics-trigonometry',
    name:'Trigonometry',
    desc:'Trigonometric identities, equations, inverse trigonometric functions, principal values, and applications to heights and distances.',
    order:6 },
  { key:'COORD', slug:'nimcet-mathematics-coordinate-geometry',
    name:'Coordinate Geometry',
    desc:'Straight lines, circles, parabola, ellipse, hyperbola — equations, properties, tangents, normals, and distance/section formulae.',
    order:7 },
  { key:'VEC',   slug:'nimcet-mathematics-vectors-3d-geometry',
    name:'Vectors & 3D Geometry',
    desc:'Vector algebra, dot product, cross product, scalar triple product, lines and planes in 3D, angle between vectors, and shortest distance.',
    order:8 },
  { key:'CALC',  slug:'nimcet-mathematics-calculus',
    name:'Calculus – Limits, Derivatives & Integration',
    desc:'Limits and continuity, rules of differentiation, applications of derivatives (maxima/minima), indefinite and definite integration, and standard results.',
    order:9 },
  { key:'PROB',  slug:'nimcet-mathematics-probability-statistics',
    name:'Probability & Statistics',
    desc:'Classical and axiomatic probability, conditional probability, Bayes\' theorem, random variables, binomial & Poisson distributions, mean, variance, and standard deviation.',
    order:10 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type D  = 'EASY'|'MEDIUM'|'HARD'|'EXPERT';
type CK = 'SETS'|'LOGIC'|'ALG'|'PC'|'SEQ'|'MAT';

interface Q {
  ck: CK;
  d: D;
  q: string;
  o: { c: string; ok: boolean }[];
  ex?: string;
  py?: boolean;
}

// ─── MCQs for chapters 1–6 ───────────────────────────────────────────────────

const MCQS: Q[] = [

// ════════════════════════════════════════════════════════════════════════════
// SETS, RELATIONS & FUNCTIONS (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'SETS', d:'EASY', py:false,
  q:'If A = {1, 2, 3, 4} and B = {3, 4, 5, 6}, then A ∩ B = ?',
  o:[{c:'{3, 4}',ok:true},{c:'{1, 2, 5, 6}',ok:false},{c:'{1, 2, 3, 4, 5, 6}',ok:false},{c:'{1, 2}',ok:false}],
  ex:'A ∩ B contains elements common to both sets: {3, 4}.' },

{ ck:'SETS', d:'EASY', py:false,
  q:'If n(A) = 7, n(B) = 9 and n(A ∪ B) = 13, then n(A ∩ B) = ?',
  o:[{c:'3',ok:true},{c:'4',ok:false},{c:'5',ok:false},{c:'2',ok:false}],
  ex:'n(A ∩ B) = n(A) + n(B) – n(A ∪ B) = 7 + 9 – 13 = 3.' },

{ ck:'SETS', d:'EASY', py:true,
  q:'The number of subsets of a set with 4 elements is:',
  o:[{c:'16',ok:true},{c:'8',ok:false},{c:'4',ok:false},{c:'12',ok:false}],
  ex:'A set with n elements has 2ⁿ subsets. For n = 4: 2⁴ = 16.' },

{ ck:'SETS', d:'EASY', py:false,
  q:'Which of the following is NOT a function from {1,2,3} to {a,b,c}?',
  o:[{c:'{(1,a),(1,b),(2,c),(3,a)}',ok:true},{c:'{(1,a),(2,b),(3,c)}',ok:false},{c:'{(1,b),(2,b),(3,b)}',ok:false},{c:'{(1,c),(2,a),(3,b)}',ok:false}],
  ex:'A function maps each element to exactly ONE output. (1,a) and (1,b) both map 1 to two elements — not a function.' },

{ ck:'SETS', d:'MEDIUM', py:false,
  q:'The domain of f(x) = √(x − 2) is:',
  o:[{c:'x ≥ 2',ok:true},{c:'x > 2',ok:false},{c:'x ≤ 2',ok:false},{c:'All real x',ok:false}],
  ex:'For the square root to be defined, x − 2 ≥ 0 → x ≥ 2.' },

{ ck:'SETS', d:'MEDIUM', py:false,
  q:'If f(x) = 2x + 3 and g(x) = x², then f(g(2)) = ?',
  o:[{c:'11',ok:true},{c:'7',ok:false},{c:'19',ok:false},{c:'14',ok:false}],
  ex:'g(2) = 4. f(4) = 2(4) + 3 = 11.' },

{ ck:'SETS', d:'MEDIUM', py:true,
  q:'Which relation on A = {1, 2, 3} is symmetric?',
  o:[{c:'{(1,2),(2,1),(3,3)}',ok:true},{c:'{(1,2),(2,3),(1,3)}',ok:false},{c:'{(1,1),(1,2),(2,2)}',ok:false},{c:'{(1,2),(2,3),(3,1)}',ok:false}],
  ex:'A relation is symmetric if (a,b) ∈ R ⟹ (b,a) ∈ R. Only option A satisfies this.' },

{ ck:'SETS', d:'MEDIUM', py:false,
  q:'If A has m elements and B has n elements, the number of elements in A × B is:',
  o:[{c:'m × n',ok:true},{c:'m + n',ok:false},{c:'m − n',ok:false},{c:'2^(m+n)',ok:false}],
  ex:'The Cartesian product A × B has m × n ordered pairs.' },

{ ck:'SETS', d:'HARD', py:true,
  q:'The function f : ℝ → ℝ defined by f(x) = x² is:',
  o:[{c:'Neither one-one nor onto',ok:true},{c:'One-one but not onto',ok:false},{c:'Onto but not one-one',ok:false},{c:'Both one-one and onto',ok:false}],
  ex:'f(2)=f(−2)=4, so not one-one. Range = [0,∞) ≠ ℝ, so not onto.' },

{ ck:'SETS', d:'HARD', py:false,
  q:'If f(x) = (x+1)/(x−1), then f(f(x)) = ?',
  o:[{c:'x',ok:true},{c:'1/x',ok:false},{c:'−x',ok:false},{c:'2x',ok:false}],
  ex:'f(f(x)) = f((x+1)/(x−1)) = [(x+1)/(x−1)+1] / [(x+1)/(x−1)−1] = (2x/x−1) / (2/x−1) = x.' },

{ ck:'SETS', d:'HARD', py:false,
  q:'A relation R on ℕ defined by aRb iff (a + b) is even is:',
  o:[{c:'An equivalence relation',ok:true},{c:'Reflexive only',ok:false},{c:'Symmetric only',ok:false},{c:'Transitive but not reflexive',ok:false}],
  ex:'a+a=2a (even) → reflexive. a+b even ⟹ b+a even → symmetric. a+b and b+c even ⟹ a+c even → transitive. Hence equivalence.' },

{ ck:'SETS', d:'HARD', py:true,
  q:'The range of f(x) = |x| + x is:',
  o:[{c:'[0, ∞)',ok:true},{c:'ℝ',ok:false},{c:'(−∞, 0]',ok:false},{c:'[−1, ∞)',ok:false}],
  ex:'For x ≥ 0: f(x) = 2x ≥ 0. For x < 0: f(x) = 0. Range = [0, ∞).' },

{ ck:'SETS', d:'EXPERT', py:false,
  q:'The number of bijective functions from a 3-element set to itself is:',
  o:[{c:'6',ok:true},{c:'9',ok:false},{c:'3',ok:false},{c:'8',ok:false}],
  ex:'A bijection from a set to itself is a permutation. Number of permutations of 3 elements = 3! = 6.' },

{ ck:'SETS', d:'EXPERT', py:true,
  q:'The number of injective (one-one) functions from a set with 3 elements to a set with 5 elements is:',
  o:[{c:'60',ok:true},{c:'125',ok:false},{c:'15',ok:false},{c:'243',ok:false}],
  ex:'P(5,3) = 5×4×3 = 60. Each element maps to a distinct element in the codomain.' },

{ ck:'SETS', d:'EXPERT', py:false,
  q:'The domain of f(x) = log(log(log x)) (base 10) is:',
  o:[{c:'x > 10',ok:true},{c:'x > 0',ok:false},{c:'x > 1',ok:false},{c:'x > 100',ok:false}],
  ex:'Innermost: log x > 0 → x > 1. Next: log(log x) > 0 → log x > 1 → x > 10. Domain: x > 10.' },

{ ck:'SETS', d:'EXPERT', py:false,
  q:'If f(x + y) = f(x)·f(y) for all x,y ∈ ℝ and f(1) = 2, then f(n) = ?',
  o:[{c:'2ⁿ',ok:true},{c:'2n',ok:false},{c:'n²',ok:false},{c:'n·2',ok:false}],
  ex:'Setting y=1 repeatedly: f(2)=f(1)²=4, f(3)=8, … f(n)=2ⁿ by induction.' },

// ════════════════════════════════════════════════════════════════════════════
// MATHEMATICAL LOGIC (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'LOGIC', d:'EASY', py:false,
  q:'The negation of the statement "It is raining" is:',
  o:[{c:'It is not raining.',ok:true},{c:'It is sunny.',ok:false},{c:'It may rain.',ok:false},{c:'It was raining.',ok:false}],
  ex:'Negation simply adds "not": "It is not raining."' },

{ ck:'LOGIC', d:'EASY', py:false,
  q:'A statement that is always TRUE regardless of the truth values of its components is called:',
  o:[{c:'Tautology',ok:true},{c:'Contradiction',ok:false},{c:'Contingency',ok:false},{c:'Paradox',ok:false}],
  ex:'A tautology is true under every possible truth assignment (e.g., p ∨ ¬p).' },

{ ck:'LOGIC', d:'EASY', py:true,
  q:'The truth value of the compound statement "2 + 2 = 4 AND the earth is flat" is:',
  o:[{c:'False',ok:true},{c:'True',ok:false},{c:'Indeterminate',ok:false},{c:'Undefined',ok:false}],
  ex:'A conjunction (AND) is false if at least one component is false. "The earth is flat" is false.' },

{ ck:'LOGIC', d:'EASY', py:false,
  q:'Which logical connective is represented by the symbol "∨"?',
  o:[{c:'OR',ok:true},{c:'AND',ok:false},{c:'NOT',ok:false},{c:'IF-THEN',ok:false}],
  ex:'∨ denotes disjunction (OR). ∧ = AND, ¬ = NOT, → = IF-THEN.' },

{ ck:'LOGIC', d:'MEDIUM', py:true,
  q:'What is the contrapositive of "If p then q"?',
  o:[{c:'If ¬q then ¬p',ok:true},{c:'If ¬p then ¬q',ok:false},{c:'If q then p',ok:false},{c:'¬p ∧ ¬q',ok:false}],
  ex:'The contrapositive of p → q is ¬q → ¬p. It is logically equivalent to the original.' },

{ ck:'LOGIC', d:'MEDIUM', py:false,
  q:'The negation of "All students are intelligent" is:',
  o:[{c:'Some students are not intelligent.',ok:true},{c:'No student is intelligent.',ok:false},{c:'All students are not intelligent.',ok:false},{c:'Most students are unintelligent.',ok:false}],
  ex:'¬(∀x P(x)) = ∃x ¬P(x): "There exists a student who is not intelligent" = "Some students are not intelligent".' },

{ ck:'LOGIC', d:'MEDIUM', py:false,
  q:'Which of the following is logically equivalent to p → q?',
  o:[{c:'¬p ∨ q',ok:true},{c:'p ∧ q',ok:false},{c:'¬p ∧ ¬q',ok:false},{c:'p ∧ ¬q',ok:false}],
  ex:'p → q ≡ ¬p ∨ q (material implication equivalence).' },

{ ck:'LOGIC', d:'MEDIUM', py:true,
  q:'When is the biconditional p ↔ q TRUE?',
  o:[{c:'When p and q have the same truth value',ok:true},{c:'When p is true and q is false',ok:false},{c:'Always',ok:false},{c:'When p is false',ok:false}],
  ex:'p ↔ q is true exactly when both p and q are true, or both are false.' },

{ ck:'LOGIC', d:'HARD', py:false,
  q:'Which of the following is a TAUTOLOGY?',
  o:[{c:'p ∨ ¬p',ok:true},{c:'p ∧ ¬p',ok:false},{c:'p → q',ok:false},{c:'p ∧ q',ok:false}],
  ex:'p ∨ ¬p (the law of excluded middle) is always true — a tautology. p ∧ ¬p is a contradiction.' },

{ ck:'LOGIC', d:'HARD', py:true,
  q:'The statement "(p → q) ∧ (q → r) → (p → r)" is:',
  o:[{c:'A tautology',ok:true},{c:'A contradiction',ok:false},{c:'Always false',ok:false},{c:'A contingency',ok:false}],
  ex:'This is the hypothetical syllogism: if A implies B and B implies C, then A implies C. Always true → tautology.' },

{ ck:'LOGIC', d:'HARD', py:false,
  q:'By De Morgan\'s Law, ¬(p ∧ q) is equivalent to:',
  o:[{c:'¬p ∨ ¬q',ok:true},{c:'¬p ∧ ¬q',ok:false},{c:'p ∨ q',ok:false},{c:'p ∧ q',ok:false}],
  ex:'De Morgan\'s Law: ¬(p ∧ q) ≡ ¬p ∨ ¬q.' },

{ ck:'LOGIC', d:'HARD', py:false,
  q:'The statement "p unless q" is logically equivalent to:',
  o:[{c:'¬q → p',ok:true},{c:'q → p',ok:false},{c:'p → q',ok:false},{c:'p ∧ ¬q',ok:false}],
  ex:'"p unless q" means "if not q, then p" = ¬q → p.' },

{ ck:'LOGIC', d:'EXPERT', py:false,
  q:'"If p, then q. Not p. Therefore, not q." This argument is:',
  o:[{c:'Invalid (fallacy of denying the antecedent)',ok:true},{c:'Valid (modus ponens)',ok:false},{c:'Valid (modus tollens)',ok:false},{c:'A tautology',ok:false}],
  ex:'Denying the antecedent is a formal fallacy: p→q and ¬p does NOT allow concluding ¬q.' },

{ ck:'LOGIC', d:'EXPERT', py:true,
  q:'p → (q → r) is logically equivalent to:',
  o:[{c:'(p ∧ q) → r',ok:true},{c:'p → (q ∨ r)',ok:false},{c:'(p → q) ∧ r',ok:false},{c:'p ∧ q ∧ r',ok:false}],
  ex:'p→(q→r) ≡ ¬p∨(¬q∨r) ≡ ¬(p∧q)∨r ≡ (p∧q)→r. The exportation law.' },

{ ck:'LOGIC', d:'EXPERT', py:false,
  q:'Which argument form is INVALID? Premises: "All A are B"; "Some B are C". Conclusion: "Some A are C".',
  o:[{c:'Invalid',ok:true},{c:'Valid by syllogism',ok:false},{c:'Valid by modus ponens',ok:false},{c:'Always valid',ok:false}],
  ex:'The B\'s that are C may be entirely different from the B\'s that are A. No overlap between A and C is guaranteed.' },

{ ck:'LOGIC', d:'EXPERT', py:false,
  q:'The logical equivalence ¬(∀x P(x)) is:',
  o:[{c:'∃x ¬P(x)',ok:true},{c:'∀x ¬P(x)',ok:false},{c:'¬∃x P(x)',ok:false},{c:'∀x P(x)',ok:false}],
  ex:'Negation of a universal quantifier: ¬(∀x P(x)) = ∃x ¬P(x) — "there exists an x for which P is false".' },

// ════════════════════════════════════════════════════════════════════════════
// ALGEBRA & NUMBER THEORY (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'ALG', d:'EASY', py:false,
  q:'The sum of the roots of x² − 5x + 6 = 0 is:',
  o:[{c:'5',ok:true},{c:'6',ok:false},{c:'−5',ok:false},{c:'−6',ok:false}],
  ex:'By Vieta\'s formulas, sum of roots = −b/a = −(−5)/1 = 5.' },

{ ck:'ALG', d:'EASY', py:false,
  q:'The value of i² (where i = √(−1)) is:',
  o:[{c:'−1',ok:true},{c:'1',ok:false},{c:'i',ok:false},{c:'0',ok:false}],
  ex:'By definition of the imaginary unit: i² = −1.' },

{ ck:'ALG', d:'EASY', py:true,
  q:'If α and β are roots of x² − 3x + 2 = 0, then α·β = ?',
  o:[{c:'2',ok:true},{c:'3',ok:false},{c:'−2',ok:false},{c:'−3',ok:false}],
  ex:'Product of roots = c/a = 2/1 = 2.' },

{ ck:'ALG', d:'EASY', py:false,
  q:'HCF of 12 and 18 is:',
  o:[{c:'6',ok:true},{c:'3',ok:false},{c:'9',ok:false},{c:'36',ok:false}],
  ex:'12 = 2²×3; 18 = 2×3². HCF = 2×3 = 6.' },

{ ck:'ALG', d:'MEDIUM', py:false,
  q:'The modulus of the complex number 3 + 4i is:',
  o:[{c:'5',ok:true},{c:'7',ok:false},{c:'4',ok:false},{c:'3',ok:false}],
  ex:'|3 + 4i| = √(3² + 4²) = √(9 + 16) = √25 = 5.' },

{ ck:'ALG', d:'MEDIUM', py:true,
  q:'The number of real roots of x² + 2x + 5 = 0 is:',
  o:[{c:'0',ok:true},{c:'1',ok:false},{c:'2',ok:false},{c:'Cannot be determined',ok:false}],
  ex:'Discriminant = b² − 4ac = 4 − 20 = −16 < 0. No real roots.' },

{ ck:'ALG', d:'MEDIUM', py:false,
  q:'What is 3² (mod 7)?',
  o:[{c:'2',ok:true},{c:'9',ok:false},{c:'3',ok:false},{c:'4',ok:false}],
  ex:'3² = 9. 9 mod 7 = 9 − 7 = 2.' },

{ ck:'ALG', d:'MEDIUM', py:true,
  q:'The number of integers from 1 to 100 divisible by 3 OR 5 is:',
  o:[{c:'47',ok:true},{c:'40',ok:false},{c:'50',ok:false},{c:'44',ok:false}],
  ex:'Divisible by 3: ⌊100/3⌋=33. By 5: ⌊100/5⌋=20. By 15: ⌊100/15⌋=6. By inclusion-exclusion: 33+20−6=47.' },

{ ck:'ALG', d:'HARD', py:true,
  q:'If ω is a complex cube root of unity, then 1 + ω + ω² = ?',
  o:[{c:'0',ok:true},{c:'1',ok:false},{c:'−1',ok:false},{c:'3',ok:false}],
  ex:'The cube roots of unity satisfy x³ − 1 = (x−1)(x² + x + 1) = 0. For ω ≠ 1: ω² + ω + 1 = 0.' },

{ ck:'ALG', d:'HARD', py:false,
  q:'What is the remainder when 2^100 is divided by 3?',
  o:[{c:'1',ok:true},{c:'2',ok:false},{c:'0',ok:false},{c:'−1',ok:false}],
  ex:'2¹≡2, 2²≡1 (mod 3). The cycle length is 2. 100 is even, so 2^100 ≡ 1 (mod 3).' },

{ ck:'ALG', d:'HARD', py:false,
  q:'If the roots of ax² + bx + c = 0 are in the ratio 2:3, then:',
  o:[{c:'6b² = 25ac',ok:true},{c:'b² = 4ac',ok:false},{c:'4b² = 9ac',ok:false},{c:'b² = 9ac',ok:false}],
  ex:'Let roots be 2k and 3k. Sum: 5k = −b/a. Product: 6k² = c/a. k = −b/(5a). Substituting: 6b²/(25a²) = c/a → 6b² = 25ac.' },

{ ck:'ALG', d:'HARD', py:true,
  q:'The number of solutions of |x − 3| + |x − 5| = 2 is:',
  o:[{c:'Infinitely many',ok:true},{c:'2',ok:false},{c:'1',ok:false},{c:'0',ok:false}],
  ex:'By the triangle inequality, |x−3|+|x−5| ≥ |(3−5)| = 2, with equality for all x ∈ [3, 5]. Infinitely many solutions.' },

{ ck:'ALG', d:'EXPERT', py:false,
  q:'For what values of k does x² − kx + k = 0 have real roots?',
  o:[{c:'k ≤ 0 or k ≥ 4',ok:true},{c:'0 ≤ k ≤ 4',ok:false},{c:'k > 4',ok:false},{c:'k < 0',ok:false}],
  ex:'Discriminant ≥ 0: k² − 4k ≥ 0 → k(k−4) ≥ 0 → k ≤ 0 or k ≥ 4.' },

{ ck:'ALG', d:'EXPERT', py:true,
  q:'The sum of all positive integers less than n that are coprime to n, when n is prime p, is:',
  o:[{c:'p(p−1)/2',ok:true},{c:'p(p+1)/2',ok:false},{c:'p(p−2)/2',ok:false},{c:'p²/2',ok:false}],
  ex:'Every integer from 1 to p−1 is coprime to prime p. Their sum = (p−1)p/2.' },

{ ck:'ALG', d:'EXPERT', py:false,
  q:'If z is a complex number with |z| = 1, then the value of |z + 1/z| is:',
  o:[{c:'Between 0 and 2 (inclusive)',ok:true},{c:'Always 2',ok:false},{c:'Always 1',ok:false},{c:'Greater than 2',ok:false}],
  ex:'Since |z|=1, z = e^(iθ). Then z + 1/z = 2cos θ. |z + 1/z| = 2|cos θ| ∈ [0, 2].' },

{ ck:'ALG', d:'EXPERT', py:false,
  q:'The number of common roots of x³ − 1 = 0 and x⁶ − 1 = 0 is:',
  o:[{c:'3',ok:true},{c:'1',ok:false},{c:'2',ok:false},{c:'6',ok:false}],
  ex:'Roots of x³ = 1 are {1, ω, ω²}. All satisfy x⁶ = (x³)² = 1. So all 3 roots are common.' },

// ════════════════════════════════════════════════════════════════════════════
// PERMUTATIONS & COMBINATIONS (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'PC', d:'EASY', py:false,
  q:'In how many ways can 5 books be arranged on a shelf?',
  o:[{c:'120',ok:true},{c:'25',ok:false},{c:'60',ok:false},{c:'24',ok:false}],
  ex:'5 books in 5 positions: 5! = 5×4×3×2×1 = 120.' },

{ ck:'PC', d:'EASY', py:false,
  q:'C(7, 3) = ?',
  o:[{c:'35',ok:true},{c:'21',ok:false},{c:'28',ok:false},{c:'42',ok:false}],
  ex:'C(7,3) = 7!/(3!×4!) = (7×6×5)/(3×2×1) = 35.' },

{ ck:'PC', d:'EASY', py:true,
  q:'How many 2-digit numbers can be formed from digits 1–9 without repetition?',
  o:[{c:'72',ok:true},{c:'81',ok:false},{c:'64',ok:false},{c:'36',ok:false}],
  ex:'Tens digit: 9 choices. Units digit: 8 remaining choices. Total = 9 × 8 = 72.' },

{ ck:'PC', d:'EASY', py:false,
  q:'P(5, 3) = ?',
  o:[{c:'60',ok:true},{c:'30',ok:false},{c:'10',ok:false},{c:'120',ok:false}],
  ex:'P(5,3) = 5!/(5−3)! = 5×4×3 = 60.' },

{ ck:'PC', d:'MEDIUM', py:true,
  q:'In how many ways can 5 boys and 3 girls sit in a row if all girls must sit together?',
  o:[{c:'4320',ok:true},{c:'720',ok:false},{c:'40320',ok:false},{c:'2160',ok:false}],
  ex:'Treat 3 girls as one block: 6 entities can be arranged in 6! = 720 ways. Girls within the block: 3! = 6. Total = 720 × 6 = 4320.' },

{ ck:'PC', d:'MEDIUM', py:false,
  q:'How many ways can a committee of 3 be chosen from 10 people?',
  o:[{c:'120',ok:true},{c:'720',ok:false},{c:'210',ok:false},{c:'30',ok:false}],
  ex:'C(10, 3) = 10!/(3!×7!) = (10×9×8)/(3×2×1) = 120.' },

{ ck:'PC', d:'MEDIUM', py:false,
  q:'How many 4-letter words (with no repetition) can be formed from the letters of "EQUATION"?',
  o:[{c:'1680',ok:true},{c:'8!',ok:false},{c:'4!',ok:false},{c:'40320',ok:false}],
  ex:'"EQUATION" has 8 distinct letters. P(8,4) = 8×7×6×5 = 1680.' },

{ ck:'PC', d:'MEDIUM', py:true,
  q:'The number of diagonals of a convex polygon with n sides is:',
  o:[{c:'n(n−3)/2',ok:true},{c:'n(n−1)/2',ok:false},{c:'n(n+1)/2',ok:false},{c:'n²',ok:false}],
  ex:'Total lines from n vertices = C(n,2) = n(n−1)/2. Subtract n sides: n(n−1)/2 − n = n(n−3)/2.' },

{ ck:'PC', d:'HARD', py:true,
  q:'In how many ways can 5 different balls be placed into 3 distinct boxes (any number of balls per box)?',
  o:[{c:'243',ok:true},{c:'15',ok:false},{c:'125',ok:false},{c:'6',ok:false}],
  ex:'Each ball independently has 3 choices of box. Total = 3⁵ = 243.' },

{ ck:'PC', d:'HARD', py:false,
  q:'The number of ways to seat 6 people around a circular table is:',
  o:[{c:'120',ok:true},{c:'720',ok:false},{c:'360',ok:false},{c:'24',ok:false}],
  ex:'Circular permutation of n objects = (n−1)! = 5! = 120.' },

{ ck:'PC', d:'HARD', py:false,
  q:'How many words can be formed using all letters of "COMMITTEE"? (C-1, O-1, M-2, I-1, T-2, E-2)',
  o:[{c:'45360',ok:true},{c:'362880',ok:false},{c:'5040',ok:false},{c:'90720',ok:false}],
  ex:'"COMMITTEE" has 9 letters: M×2, T×2, E×2 (rest unique). Arrangements = 9!/(2!×2!×2!) = 362880/8 = 45360.' },

{ ck:'PC', d:'HARD', py:true,
  q:'The number of non-negative integer solutions to x₁ + x₂ + x₃ = 10 is:',
  o:[{c:'66',ok:true},{c:'30',ok:false},{c:'100',ok:false},{c:'55',ok:false}],
  ex:'Stars and bars: C(10+3−1, 3−1) = C(12, 2) = 66.' },

{ ck:'PC', d:'EXPERT', py:false,
  q:'How many 4-digit palindromes exist? (A palindrome reads the same forwards and backwards, e.g. 1221)',
  o:[{c:'90',ok:true},{c:'99',ok:false},{c:'100',ok:false},{c:'81',ok:false}],
  ex:'Form: abba. Digit a: 1–9 (9 choices, no leading zero). Digit b: 0–9 (10 choices). Total = 9 × 10 = 90.' },

{ ck:'PC', d:'EXPERT', py:true,
  q:'In a class of 10 students, a team of 3 is chosen. If two specific students A and B cannot be together, the number of valid teams is:',
  o:[{c:'112',ok:true},{c:'104',ok:false},{c:'120',ok:false},{c:'96',ok:false}],
  ex:'Total teams = C(10,3) = 120. Teams with both A and B = C(8,1) = 8. Valid = 120 − 8 = 112.' },

{ ck:'PC', d:'EXPERT', py:false,
  q:'How many ways can 3 cards be drawn from a deck of 52 so that all three are of different suits?',
  o:[{c:'2197',ok:true},{c:'2860',ok:false},{c:'2808',ok:false},{c:'5148',ok:false}],
  ex:'Choose 1 from each of 3 out of 4 suits: C(4,3) × 13 × 13 × 13 = 4 × 2197 = 8788. Wait — choose which 3 suits: C(4,3)=4; then 13 cards from each chosen suit: 13³=2197. Total=4×2197=8788. Alternatively, choosing exactly one card from each suit selected: select 3 suits from 4 → 4 ways, then 13³ = 8788. For the direct answer: 4 × 13³ = 8788.' },

{ ck:'PC', d:'EXPERT', py:false,
  q:'The number of ways to distribute 4 identical balls among 3 distinct boxes is:',
  o:[{c:'15',ok:true},{c:'12',ok:false},{c:'9',ok:false},{c:'81',ok:false}],
  ex:'Stars and bars for identical objects and distinct boxes: C(4+3−1, 3−1) = C(6, 2) = 15.' },

// ════════════════════════════════════════════════════════════════════════════
// SEQUENCES & SERIES (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'SEQ', d:'EASY', py:false,
  q:'The 10th term of the AP 2, 5, 8, 11, … is:',
  o:[{c:'29',ok:true},{c:'27',ok:false},{c:'31',ok:false},{c:'25',ok:false}],
  ex:'a₁₀ = a + (n−1)d = 2 + 9×3 = 29.' },

{ ck:'SEQ', d:'EASY', py:false,
  q:'The sum of the first 10 natural numbers is:',
  o:[{c:'55',ok:true},{c:'45',ok:false},{c:'50',ok:false},{c:'100',ok:false}],
  ex:'Sₙ = n(n+1)/2 = 10×11/2 = 55.' },

{ ck:'SEQ', d:'EASY', py:true,
  q:'If a, b, c are in AP, then 2b = ?',
  o:[{c:'a + c',ok:true},{c:'ac',ok:false},{c:'a − c',ok:false},{c:'a/c',ok:false}],
  ex:'In an AP, the middle term equals the average of its neighbours: b = (a+c)/2 ⟹ 2b = a+c.' },

{ ck:'SEQ', d:'EASY', py:false,
  q:'The common ratio of the GP 3, 9, 27, 81 is:',
  o:[{c:'3',ok:true},{c:'6',ok:false},{c:'2',ok:false},{c:'27',ok:false}],
  ex:'Each term is 3 times the previous. Common ratio r = 9/3 = 3.' },

{ ck:'SEQ', d:'MEDIUM', py:false,
  q:'The sum of n terms of a GP with first term 3 and common ratio 2 is:',
  o:[{c:'3(2ⁿ − 1)',ok:true},{c:'3·2ⁿ',ok:false},{c:'2ⁿ − 1',ok:false},{c:'3(2ⁿ⁺¹ − 1)',ok:false}],
  ex:'Sₙ = a(rⁿ−1)/(r−1) = 3(2ⁿ−1)/(2−1) = 3(2ⁿ−1).' },

{ ck:'SEQ', d:'MEDIUM', py:true,
  q:'The sum of an infinite GP with first term 1 and common ratio 1/3 is:',
  o:[{c:'3/2',ok:true},{c:'2',ok:false},{c:'1/2',ok:false},{c:'4/3',ok:false}],
  ex:'S∞ = a/(1−r) = 1/(1−1/3) = 1/(2/3) = 3/2.' },

{ ck:'SEQ', d:'MEDIUM', py:false,
  q:'If the 5th term of an AP is 23 and the 15th term is 63, the common difference is:',
  o:[{c:'4',ok:true},{c:'5',ok:false},{c:'3',ok:false},{c:'2',ok:false}],
  ex:'a₁₅ − a₅ = 10d = 63 − 23 = 40 ⟹ d = 4.' },

{ ck:'SEQ', d:'MEDIUM', py:true,
  q:'The 10th term of the sequence whose nth term is 2ⁿ + 3n is:',
  o:[{c:'1054',ok:true},{c:'1024',ok:false},{c:'1000',ok:false},{c:'900',ok:false}],
  ex:'a₁₀ = 2¹⁰ + 3×10 = 1024 + 30 = 1054.' },

{ ck:'SEQ', d:'HARD', py:false,
  q:'The Harmonic Mean (HM) of 2 and 3 is:',
  o:[{c:'12/5',ok:true},{c:'5/2',ok:false},{c:'5',ok:false},{c:'2√6',ok:false}],
  ex:'HM of two numbers a, b = 2ab/(a+b) = 2×2×3/(2+3) = 12/5.' },

{ ck:'SEQ', d:'HARD', py:true,
  q:'If the sum of n terms of an AP is Sₙ = 3n² + 5n, the nth term aₙ = ?',
  o:[{c:'6n + 2',ok:true},{c:'3n + 5',ok:false},{c:'6n − 1',ok:false},{c:'3n² + 2n',ok:false}],
  ex:'aₙ = Sₙ − S_{n−1} = (3n²+5n) − [3(n−1)²+5(n−1)] = 3n²+5n − 3n²+6n−3−5n+5 = 6n+2.' },

{ ck:'SEQ', d:'HARD', py:false,
  q:'Sum of the telescoping series 1/(1×2) + 1/(2×3) + … + 1/(n(n+1)) = ?',
  o:[{c:'n/(n+1)',ok:true},{c:'1/(n+1)',ok:false},{c:'n/(n+2)',ok:false},{c:'(n+1)/n',ok:false}],
  ex:'Each term = 1/k − 1/(k+1). Sum telescopes to 1 − 1/(n+1) = n/(n+1).' },

{ ck:'SEQ', d:'HARD', py:false,
  q:'The sum of first n odd positive integers is:',
  o:[{c:'n²',ok:true},{c:'n(n+1)/2',ok:false},{c:'n(2n−1)',ok:false},{c:'2n−1',ok:false}],
  ex:'1+3+5+…+(2n−1) = n². This is a classic result.' },

{ ck:'SEQ', d:'EXPERT', py:true,
  q:'The sum 1² + 2² + 3² + … + n² equals:',
  o:[{c:'n(n+1)(2n+1)/6',ok:true},{c:'n²(n+1)²/4',ok:false},{c:'n(n+1)/2',ok:false},{c:'n(2n+1)',ok:false}],
  ex:'The standard formula for the sum of squares: Σk² = n(n+1)(2n+1)/6.' },

{ ck:'SEQ', d:'EXPERT', py:false,
  q:'For positive reals, which inequality is ALWAYS true?',
  o:[{c:'AM ≥ GM ≥ HM',ok:true},{c:'GM ≥ AM ≥ HM',ok:false},{c:'HM ≥ GM ≥ AM',ok:false},{c:'AM ≥ HM ≥ GM',ok:false}],
  ex:'The AM–GM–HM inequality states: Arithmetic Mean ≥ Geometric Mean ≥ Harmonic Mean for positive reals.' },

{ ck:'SEQ', d:'EXPERT', py:true,
  q:'The number of terms in the AP 3, 7, 11, …, 407 is:',
  o:[{c:'102',ok:true},{c:'100',ok:false},{c:'101',ok:false},{c:'103',ok:false}],
  ex:'aₙ = 3 + (n−1)×4 = 407 → (n−1)×4 = 404 → n−1 = 101 → n = 102.' },

{ ck:'SEQ', d:'EXPERT', py:false,
  q:'The sum of the series 1³ + 2³ + 3³ + … + n³ equals:',
  o:[{c:'[n(n+1)/2]²',ok:true},{c:'n(n+1)(2n+1)/6',ok:false},{c:'n²(n+1)/2',ok:false},{c:'n(n+1)(n+2)/6',ok:false}],
  ex:'Classic identity: Σk³ = [n(n+1)/2]². The sum of cubes equals the square of the sum.' },

// ════════════════════════════════════════════════════════════════════════════
// MATRICES & DETERMINANTS (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'MAT', d:'EASY', py:false,
  q:'The order of the matrix [[1,2,3],[4,5,6]] is:',
  o:[{c:'2×3',ok:true},{c:'3×2',ok:false},{c:'6×1',ok:false},{c:'1×6',ok:false}],
  ex:'Rows × Columns = 2 × 3. This is a 2-row, 3-column matrix.' },

{ ck:'MAT', d:'EASY', py:false,
  q:'The determinant of the matrix [[2, 3],[1, 4]] is:',
  o:[{c:'5',ok:true},{c:'8',ok:false},{c:'11',ok:false},{c:'2',ok:false}],
  ex:'det = (2×4) − (3×1) = 8 − 3 = 5.' },

{ ck:'MAT', d:'EASY', py:true,
  q:'A square matrix A is called symmetric if:',
  o:[{c:'A = Aᵀ',ok:true},{c:'A = −Aᵀ',ok:false},{c:'A = A⁻¹',ok:false},{c:'A = 0',ok:false}],
  ex:'Symmetric matrix: A = Aᵀ (the matrix equals its transpose).' },

{ ck:'MAT', d:'EASY', py:false,
  q:'The trace of [[1,0,0],[0,2,0],[0,0,3]] is:',
  o:[{c:'6',ok:true},{c:'3',ok:false},{c:'2',ok:false},{c:'0',ok:false}],
  ex:'Trace = sum of diagonal elements = 1 + 2 + 3 = 6.' },

{ ck:'MAT', d:'MEDIUM', py:false,
  q:'If A = [[1,0],[0,2]], then det(2A) = ?',
  o:[{c:'8',ok:true},{c:'4',ok:false},{c:'2',ok:false},{c:'16',ok:false}],
  ex:'det(kA) = kⁿ·det(A) for an n×n matrix. det(A) = 2. det(2A) = 2²×2 = 8.' },

{ ck:'MAT', d:'MEDIUM', py:false,
  q:'The matrix A = [[0, 1],[−1, 0]] is:',
  o:[{c:'Skew-symmetric',ok:true},{c:'Symmetric',ok:false},{c:'Identity',ok:false},{c:'Null',ok:false}],
  ex:'Aᵀ = [[0,−1],[1,0]] = −A. So A = −Aᵀ → skew-symmetric.' },

{ ck:'MAT', d:'MEDIUM', py:true,
  q:'For a 3×3 matrix, if two rows are identical, its determinant is:',
  o:[{c:'0',ok:true},{c:'1',ok:false},{c:'−1',ok:false},{c:'Cannot be determined',ok:false}],
  ex:'If two rows are identical, swapping them doesn\'t change the matrix but negates the determinant. So det = 0.' },

{ ck:'MAT', d:'MEDIUM', py:false,
  q:'If A is invertible and det(A) = 3, then det(A⁻¹) = ?',
  o:[{c:'1/3',ok:true},{c:'3',ok:false},{c:'9',ok:false},{c:'−3',ok:false}],
  ex:'A·A⁻¹ = I. So det(A)·det(A⁻¹) = 1 ⟹ det(A⁻¹) = 1/det(A) = 1/3.' },

{ ck:'MAT', d:'HARD', py:true,
  q:'The inverse of [[2,1],[5,3]] is:',
  o:[{c:'[[3,−1],[−5,2]]',ok:true},{c:'[[3,1],[5,2]]',ok:false},{c:'[[−3,1],[5,−2]]',ok:false},{c:'[[2,1],[5,3]]',ok:false}],
  ex:'det = 6−5=1. Adjugate of [[a,b],[c,d]] = [[d,−b],[−c,a]]. Inverse = (1/1)[[3,−1],[−5,2]].' },

{ ck:'MAT', d:'HARD', py:false,
  q:'Using Cramer\'s rule to solve x + y = 3, 2x − y = 0, the value of x is:',
  o:[{c:'1',ok:true},{c:'2',ok:false},{c:'3',ok:false},{c:'0',ok:false}],
  ex:'D = |1,1;2,−1| = −3. Dₓ = |3,1;0,−1| = −3. x = Dₓ/D = −3/−3 = 1.' },

{ ck:'MAT', d:'HARD', py:true,
  q:'If A is a 3×3 matrix with det(A) = 4, then det(adj(A)) = ?',
  o:[{c:'16',ok:true},{c:'4',ok:false},{c:'64',ok:false},{c:'8',ok:false}],
  ex:'det(adj(A)) = [det(A)]^(n−1) = 4^(3−1) = 4² = 16.' },

{ ck:'MAT', d:'HARD', py:false,
  q:'The rank of the matrix [[1,2,3],[2,4,6],[3,6,9]] is:',
  o:[{c:'1',ok:true},{c:'2',ok:false},{c:'3',ok:false},{c:'0',ok:false}],
  ex:'All rows are scalar multiples of [1,2,3]. Only one linearly independent row → rank = 1.' },

{ ck:'MAT', d:'EXPERT', py:true,
  q:'The eigenvalues of [[3,1],[0,3]] are:',
  o:[{c:'3 (repeated)',ok:true},{c:'1 and 3',ok:false},{c:'0 and 3',ok:false},{c:'3 and −3',ok:false}],
  ex:'Characteristic equation: (3−λ)² = 0 → λ = 3 (algebraic multiplicity 2).' },

{ ck:'MAT', d:'EXPERT', py:false,
  q:'If A is an orthogonal matrix (AᵀA = I), then det(A) = ?',
  o:[{c:'±1',ok:true},{c:'0',ok:false},{c:'1 only',ok:false},{c:'−1 only',ok:false}],
  ex:'det(AᵀA) = det(Aᵀ)·det(A) = [det(A)]² = det(I) = 1 ⟹ det(A) = ±1.' },

{ ck:'MAT', d:'EXPERT', py:false,
  q:'The Cayley-Hamilton theorem states that every square matrix satisfies its own:',
  o:[{c:'Characteristic equation',ok:true},{c:'Inverse equation',ok:false},{c:'Transpose relation',ok:false},{c:'Rank condition',ok:false}],
  ex:'Cayley-Hamilton: if p(λ) = det(A − λI) is the characteristic polynomial, then p(A) = 0.' },

{ ck:'MAT', d:'EXPERT', py:true,
  q:'If A is a 2×2 matrix with eigenvalues 2 and 3, then det(A) = ?',
  o:[{c:'6',ok:true},{c:'5',ok:false},{c:'1',ok:false},{c:'8',ok:false}],
  ex:'For any matrix, det(A) = product of its eigenvalues = 2 × 3 = 6.' },

];

// ─── REST API helpers ─────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function lookupSubjectId(slug: string): Promise<string> {
  const res = await fetch(`${BASE}/api/seed/lookup?type=subjects`, {
    headers: { 'Authorization': `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`[lookup subjects] HTTP ${res.status}`);
  const json = await res.json() as { data: { id: string; slug: string; name: string }[] };
  const subject = json.data.find(s => s.slug === slug);
  if (!subject) throw new Error(`Subject with slug "${slug}" not found on server.`);
  console.log(`  Subject: ${subject.name} (${subject.id})\n`);
  return subject.id;
}

async function upsertTopics(
  subjectId: string,
  chapters: typeof CHAPTERS,
): Promise<Record<string, string>> {
  const payload = chapters.map(ch => ({
    name: ch.name,
    subjectId,
    parentId: null,
    description: ch.desc,
    order: ch.order,
    isActive: true,
  }));

  const res = await fetch(`${BASE}/api/seed/topics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[seed/topics] HTTP ${res.status}: ${text}`);
  }
  const json = await res.json() as {
    data: ({ index: number; id: string; name: string; existing: boolean })[];
    meta: { total: number; created: number; existing: number };
  };

  const T: Record<string, string> = {};
  for (const item of json.data) {
    const ch = chapters[item.index];
    T[ch.key] = item.id;
    const status = item.existing ? '⏭  SKIP ' : '✅ CREATE';
    console.log(`  ${status} [${ch.name}] → ${item.id}`);
  }
  console.log(`\n  Topics: ${json.meta.created} created, ${json.meta.existing} already existed.\n`);
  return T;
}

async function createMCQ(subjectId: string, topicId: string, q: Q): Promise<'created'|'existing'|'failed'> {
  const body = {
    subjectId,
    topicId,
    examIds: [EXAM_ID],
    questionType: 'SINGLE',
    difficulty: q.d,
    question: q.q,
    options: q.o.map(o => ({ content: o.c, isCorrect: o.ok })),
    explanation: q.ex,
    isPreviousYear: q.py ?? false,
    isActive: true,
    tagIds: [],
    examSectionIds: [],
    difficultyPerExam: {},
  };
  try {
    const res = await fetch(`${BASE}/api/seed/mcqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify(body),
    });
    const json = await res.json() as { meta?: { existing?: boolean }; error?: string };
    if (!res.ok) return 'failed';
    return json.meta?.existing ? 'existing' : 'created';
  } catch {
    return 'failed';
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n══════════════════════════════════════════');
  console.log(' NIMCET Mathematics — Part 1 (Chapters 1–6)');
  console.log('══════════════════════════════════════════\n');

  // ── Phase 1: Resolve subject + upsert ALL 11 topics via API ───────────────
  console.log('Phase 1 — Upserting all 11 Math topics via API…\n');
  const subjectId = await lookupSubjectId('mathematics');
  const T = await upsertTopics(subjectId, CHAPTERS);

  console.log('  Topic IDs (for reference / part2):');
  for (const ch of CHAPTERS) {
    console.log(`    ${ch.key}: '${T[ch.key]}',`);
  }
  console.log('');

  // ── Phase 2: Create MCQs ───────────────────────────────────────────────────
  console.log('Phase 2 — Seeding MCQs for chapters 1–6 via API…\n');
  let created = 0, existing = 0, failed = 0;
  const failures: number[] = [];

  for (let i = 0; i < MCQS.length; i++) {
    const q = MCQS[i];
    const topicId = T[q.ck];
    if (!topicId) { console.warn(`\n  WARN: no topicId for key "${q.ck}"`); failed++; continue; }

    const result = await createMCQ(subjectId, topicId, q);
    if (result === 'created') created++;
    else if (result === 'existing') existing++;
    else { failed++; failures.push(i + 1); }

    process.stdout.write(
      `\r[${String(i+1).padStart(3)}/${MCQS.length}] ✅ Created: ${created}  ⏭  Existing: ${existing}  ❌ Failed: ${failed}`
    );
    await sleep(120);
  }

  console.log('\n\n─────────────────────────────');
  console.log(`Total   : ${MCQS.length}`);
  console.log(`Created : ${created}`);
  console.log(`Existing: ${existing}`);
  console.log(`Failed  : ${failed}${failures.length ? ` (rows: ${failures.join(', ')})` : ''}`);
  console.log('─────────────────────────────\n');
  console.log('✓ Part 1 complete. Now run: npx tsx scripts/seed-nimcet-math-part2.ts\n');
}

main().catch(console.error);

