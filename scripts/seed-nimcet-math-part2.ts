#!/usr/bin/env npx tsx
/**
 * Seed NIMCET Mathematics — Part 2
 * MCQs for chapters 7–11: Trigonometry · Coordinate Geometry · Vectors · Calculus · Probability
 *
 * Run AFTER part1: npx tsx scripts/seed-nimcet-math-part2.ts
 */

export {};

const BASE    = 'https://scholar247.org';
const KEY     = 'd846e4f1862433c8d265f459f5264b721c28a93057c9b7949d8a4cf98e7bdb9f';
const EXAM_ID = '626534b9-0ac4-4d73-a400-7391b645338a';

// Chapter names for lookup (must match names used in part1)
const CHAPTER_NAMES: Record<CK, string> = {
  TRIG:  'Trigonometry',
  COORD: 'Coordinate Geometry',
  VEC:   'Vectors & 3D Geometry',
  CALC:  'Calculus – Limits, Derivatives & Integration',
  PROB:  'Probability & Statistics',
};

// ─── REST API helpers ─────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function lookupSubjectAndTopics(): Promise<{ subjectId: string; T: Record<string, string> }> {
  // 1. Resolve subject
  const subRes = await fetch(`${BASE}/api/seed/lookup?type=subjects`, {
    headers: { 'Authorization': `Bearer ${KEY}` },
  });
  if (!subRes.ok) throw new Error(`[lookup subjects] HTTP ${subRes.status}`);
  const subJson = await subRes.json() as { data: { id: string; slug: string; name: string }[] };
  const subject = subJson.data.find(s => s.slug === 'mathematics');
  if (!subject) throw new Error('Subject with slug "mathematics" not found on server.');
  console.log(`  Subject: ${subject.name} (${subject.id})\n`);

  // 2. Resolve topics (chapters) created by part1
  const topRes = await fetch(`${BASE}/api/seed/lookup?type=topics&subjectId=${subject.id}`, {
    headers: { 'Authorization': `Bearer ${KEY}` },
  });
  if (!topRes.ok) throw new Error(`[lookup topics] HTTP ${topRes.status}`);
  const topJson = await topRes.json() as { data: { id: string; name: string; depth: number }[] };

  const T: Record<string, string> = {};
  for (const [key, name] of Object.entries(CHAPTER_NAMES) as [CK, string][]) {
    const topic = topJson.data.find(t => t.name === name && t.depth === 0);
    if (!topic) throw new Error(`Topic "${name}" not found. Run seed-nimcet-math-part1.ts first.`);
    T[key] = topic.id;
    console.log(`  ${key}: ${topic.id} — ${topic.name}`);
  }
  console.log('');

  return { subjectId: subject.id, T };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type D  = 'EASY'|'MEDIUM'|'HARD'|'EXPERT';
type CK = 'TRIG'|'COORD'|'VEC'|'CALC'|'PROB';

interface Q {
  ck: CK;
  d: D;
  q: string;
  o: { c: string; ok: boolean }[];
  ex?: string;
  py?: boolean;
}

// ─── MCQs for chapters 7–11 ──────────────────────────────────────────────────

const MCQS: Q[] = [

// ════════════════════════════════════════════════════════════════════════════
// TRIGONOMETRY (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'TRIG', d:'EASY', py:false,
  q:'The value of sin²θ + cos²θ is:',
  o:[{c:'1',ok:true},{c:'0',ok:false},{c:'2',ok:false},{c:'sin(2θ)',ok:false}],
  ex:'Fundamental Pythagorean identity: sin²θ + cos²θ = 1 for all θ.' },

{ ck:'TRIG', d:'EASY', py:false,
  q:'The value of sin 30° is:',
  o:[{c:'1/2',ok:true},{c:'√3/2',ok:false},{c:'1/√2',ok:false},{c:'√3',ok:false}],
  ex:'Standard value: sin 30° = 1/2.' },

{ ck:'TRIG', d:'EASY', py:true,
  q:'cos 2θ is equal to:',
  o:[{c:'1 − 2sin²θ',ok:true},{c:'2sin²θ',ok:false},{c:'2cos²θ − 2',ok:false},{c:'sin²θ − cos²θ',ok:false}],
  ex:'Double angle identity: cos 2θ = cos²θ − sin²θ = 1 − 2sin²θ = 2cos²θ − 1.' },

{ ck:'TRIG', d:'EASY', py:false,
  q:'If tan θ = 1, then the principal value of θ is:',
  o:[{c:'45°',ok:true},{c:'30°',ok:false},{c:'60°',ok:false},{c:'90°',ok:false}],
  ex:'tan 45° = 1. Principal value θ = 45° (π/4).' },

{ ck:'TRIG', d:'MEDIUM', py:false,
  q:'The principal value of sin⁻¹(√3/2) is:',
  o:[{c:'π/3',ok:true},{c:'π/6',ok:false},{c:'π/4',ok:false},{c:'2π/3',ok:false}],
  ex:'sin(π/3) = √3/2. Principal value range of sin⁻¹ is [−π/2, π/2]. Answer: π/3.' },

{ ck:'TRIG', d:'MEDIUM', py:true,
  q:'If sin A = 3/5 (A acute), then cos 2A = ?',
  o:[{c:'7/25',ok:true},{c:'24/25',ok:false},{c:'−7/25',ok:false},{c:'7/5',ok:false}],
  ex:'cos 2A = 1 − 2sin²A = 1 − 2(9/25) = 1 − 18/25 = 7/25.' },

{ ck:'TRIG', d:'MEDIUM', py:false,
  q:'The general solution of sin x = 1/2 is:',
  o:[{c:'nπ + (−1)ⁿ π/6, n ∈ ℤ',ok:true},{c:'2nπ ± π/6',ok:false},{c:'nπ + π/6',ok:false},{c:'2nπ + π/6',ok:false}],
  ex:'General solution of sin x = sin α is x = nπ + (−1)ⁿα. Here α = π/6.' },

{ ck:'TRIG', d:'MEDIUM', py:true,
  q:'The maximum value of 3 sin x + 4 cos x is:',
  o:[{c:'5',ok:true},{c:'7',ok:false},{c:'4',ok:false},{c:'3',ok:false}],
  ex:'Maximum of a sin x + b cos x = √(a²+b²) = √(9+16) = 5.' },

{ ck:'TRIG', d:'HARD', py:true,
  q:'The value of cos 75° + sin 75° is:',
  o:[{c:'√6/2',ok:true},{c:'√3/2',ok:false},{c:'√2/2',ok:false},{c:'(√3+1)/2',ok:false}],
  ex:'cos 75°=(√6−√2)/4, sin 75°=(√6+√2)/4. Sum = 2√6/4 = √6/2.' },

{ ck:'TRIG', d:'HARD', py:false,
  q:'If sin(A+B) = 1 and sin(A−B) = 1/2, the value of A is:',
  o:[{c:'60°',ok:true},{c:'45°',ok:false},{c:'30°',ok:false},{c:'75°',ok:false}],
  ex:'sin(A+B)=1 → A+B=90°. sin(A−B)=1/2 → A−B=30°. Adding: 2A=120° → A=60°.' },

{ ck:'TRIG', d:'HARD', py:false,
  q:'The number of solutions of 2sin²x + sin x − 1 = 0 in [0, 2π] is:',
  o:[{c:'3',ok:true},{c:'2',ok:false},{c:'4',ok:false},{c:'1',ok:false}],
  ex:'(2sin x − 1)(sin x + 1) = 0 → sin x = 1/2 (x = π/6, 5π/6) or sin x = −1 (x = 3π/2). Total: 3 solutions.' },

{ ck:'TRIG', d:'HARD', py:true,
  q:'In triangle ABC with sides a=5, b=6, c=7, cos A = ?',
  o:[{c:'5/7',ok:true},{c:'3/7',ok:false},{c:'2/3',ok:false},{c:'4/7',ok:false}],
  ex:'Cosine rule: cos A = (b²+c²−a²)/(2bc) = (36+49−25)/(2×6×7) = 60/84 = 5/7.' },

{ ck:'TRIG', d:'EXPERT', py:false,
  q:'tan 3A − tan 2A − tan A equals:',
  o:[{c:'tan A · tan 2A · tan 3A',ok:true},{c:'0',ok:false},{c:'1',ok:false},{c:'tan 6A',ok:false}],
  ex:'Using tan 3A = tan(2A+A): expanding shows tan 3A−tan 2A−tan A = tan A·tan 2A·tan 3A.' },

{ ck:'TRIG', d:'EXPERT', py:true,
  q:'If cos α + cos β = a and sin α + sin β = b, then cos(α−β) = ?',
  o:[{c:'(a²+b²−2)/2',ok:true},{c:'(a²+b²)/2',ok:false},{c:'(a²−b²)/2',ok:false},{c:'ab/2',ok:false}],
  ex:'Squaring and adding: (cosα+cosβ)²+(sinα+sinβ)² = a²+b² → 2+2cos(α−β)=a²+b² → cos(α−β)=(a²+b²−2)/2.' },

{ ck:'TRIG', d:'EXPERT', py:false,
  q:'The value of sin 18° is:',
  o:[{c:'(√5−1)/4',ok:true},{c:'(√5+1)/4',ok:false},{c:'√5/4',ok:false},{c:'1/4',ok:false}],
  ex:'Let θ=18°. Then 5θ=90°, so 2θ=90°−3θ. Using identities, sin 18° = (√5−1)/4.' },

{ ck:'TRIG', d:'EXPERT', py:false,
  q:'The expression sin(A+B)·sin(A−B) simplifies to:',
  o:[{c:'sin²A − sin²B',ok:true},{c:'cos²A − cos²B',ok:false},{c:'sin²A + sin²B',ok:false},{c:'cos²B − sin²A',ok:false}],
  ex:'sin(A+B)·sin(A−B) = (sinA cosB + cosA sinB)(sinA cosB − cosA sinB) = sin²A cos²B − cos²A sin²B = sin²A(1−sin²B)−(1−sin²A)sin²B = sin²A − sin²B.' },

// ════════════════════════════════════════════════════════════════════════════
// COORDINATE GEOMETRY (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'COORD', d:'EASY', py:false,
  q:'The distance between the points (3, 4) and the origin (0, 0) is:',
  o:[{c:'5',ok:true},{c:'7',ok:false},{c:'4',ok:false},{c:'3',ok:false}],
  ex:'Distance = √(3²+4²) = √25 = 5.' },

{ ck:'COORD', d:'EASY', py:false,
  q:'The midpoint of the segment joining (2, 4) and (6, 8) is:',
  o:[{c:'(4, 6)',ok:true},{c:'(3, 5)',ok:false},{c:'(5, 7)',ok:false},{c:'(8, 12)',ok:false}],
  ex:'Midpoint = ((2+6)/2, (4+8)/2) = (4, 6).' },

{ ck:'COORD', d:'EASY', py:true,
  q:'The slope of the line joining (1, 2) and (3, 8) is:',
  o:[{c:'3',ok:true},{c:'2',ok:false},{c:'4',ok:false},{c:'1',ok:false}],
  ex:'Slope = (8−2)/(3−1) = 6/2 = 3.' },

{ ck:'COORD', d:'EASY', py:false,
  q:'The equation of the x-axis is:',
  o:[{c:'y = 0',ok:true},{c:'x = 0',ok:false},{c:'x = y',ok:false},{c:'y = 1',ok:false}],
  ex:'On the x-axis, the y-coordinate is always 0. Equation: y = 0.' },

{ ck:'COORD', d:'MEDIUM', py:false,
  q:'The equation of the line with slope 2 passing through (1, 3) is:',
  o:[{c:'y = 2x + 1',ok:true},{c:'y = 2x + 3',ok:false},{c:'y = 3x + 1',ok:false},{c:'y = x + 2',ok:false}],
  ex:'y − 3 = 2(x − 1) → y = 2x + 1.' },

{ ck:'COORD', d:'MEDIUM', py:true,
  q:'The centre of the circle x² + y² − 6x + 4y − 12 = 0 is:',
  o:[{c:'(3, −2)',ok:true},{c:'(−3, 2)',ok:false},{c:'(6, −4)',ok:false},{c:'(3, 2)',ok:false}],
  ex:'Completing the square: (x−3)²+(y+2)²=25. Centre = (3, −2), radius = 5.' },

{ ck:'COORD', d:'MEDIUM', py:false,
  q:'The area of the triangle with vertices (1,2), (3,4), (5,0) is:',
  o:[{c:'6',ok:true},{c:'12',ok:false},{c:'4',ok:false},{c:'8',ok:false}],
  ex:'Area = ½|x₁(y₂−y₃)+x₂(y₃−y₁)+x₃(y₁−y₂)| = ½|1(4−0)+3(0−2)+5(2−4)| = ½|4−6−10| = 6.' },

{ ck:'COORD', d:'MEDIUM', py:true,
  q:'The y-intercept of the line 3x + 4y = 12 is:',
  o:[{c:'3',ok:true},{c:'4',ok:false},{c:'12',ok:false},{c:'−3',ok:false}],
  ex:'Set x = 0: 4y = 12 → y = 3. The y-intercept is 3.' },

{ ck:'COORD', d:'HARD', py:false,
  q:'The length of the tangent from point (7, 1) to the circle x² + y² = 25 is:',
  o:[{c:'5',ok:true},{c:'√50',ok:false},{c:'7',ok:false},{c:'√74',ok:false}],
  ex:'Length of tangent = √(x₁²+y₁²−r²) = √(49+1−25) = √25 = 5.' },

{ ck:'COORD', d:'HARD', py:true,
  q:'The focus of the parabola y² = 8x is:',
  o:[{c:'(2, 0)',ok:true},{c:'(0, 2)',ok:false},{c:'(−2, 0)',ok:false},{c:'(4, 0)',ok:false}],
  ex:'y² = 4ax: here 4a = 8 → a = 2. Focus = (a, 0) = (2, 0).' },

{ ck:'COORD', d:'HARD', py:false,
  q:'Point P divides AB (A=(1,2), B=(7,8)) in ratio 2:1 internally. P = ?',
  o:[{c:'(5, 6)',ok:true},{c:'(4, 5)',ok:false},{c:'(3, 4)',ok:false},{c:'(6, 7)',ok:false}],
  ex:'Section formula: P = ((2×7+1×1)/3, (2×8+1×2)/3) = (15/3, 18/3) = (5, 6).' },

{ ck:'COORD', d:'HARD', py:true,
  q:'The angle between lines 2x + y = 1 and x − 2y = 3 is:',
  o:[{c:'90°',ok:true},{c:'45°',ok:false},{c:'60°',ok:false},{c:'30°',ok:false}],
  ex:'m₁ = −2, m₂ = 1/2. m₁·m₂ = −1. Product of slopes = −1 → lines are perpendicular → angle = 90°.' },

{ ck:'COORD', d:'EXPERT', py:false,
  q:'The equation of the ellipse with semi-major axis 5 and semi-minor axis 4 (along coordinate axes) is:',
  o:[{c:'x²/25 + y²/16 = 1',ok:true},{c:'x²/16 + y²/25 = 1',ok:false},{c:'x²/5 + y²/4 = 1',ok:false},{c:'25x² + 16y² = 1',ok:false}],
  ex:'Standard form: x²/a² + y²/b² = 1 where a=5, b=4 → x²/25 + y²/16 = 1.' },

{ ck:'COORD', d:'EXPERT', py:true,
  q:'The combined equation of lines y = 2x and y = −3x is:',
  o:[{c:'y² + xy − 6x² = 0',ok:true},{c:'y² − xy − 6x² = 0',ok:false},{c:'6x² + xy − y² = 0',ok:false},{c:'y² + xy + 6x² = 0',ok:false}],
  ex:'(y−2x)(y+3x) = y² + 3xy − 2xy − 6x² = y² + xy − 6x² = 0.' },

{ ck:'COORD', d:'EXPERT', py:false,
  q:'For what value of k do the lines x + 2y + 3 = 0 and 3x + ky + 9 = 0 represent the same line?',
  o:[{c:'6',ok:true},{c:'3',ok:false},{c:'9',ok:false},{c:'2',ok:false}],
  ex:'For coincident lines: 1/3 = 2/k = 3/9. From 3/9=1/3: consistent. From 1/3=2/k: k=6.' },

{ ck:'COORD', d:'EXPERT', py:false,
  q:'The eccentricity of the ellipse x²/16 + y²/9 = 1 is:',
  o:[{c:'√7/4',ok:true},{c:'√7/3',ok:false},{c:'3/4',ok:false},{c:'7/16',ok:false}],
  ex:'a²=16, b²=9. c²=a²−b²=7. e = c/a = √7/4.' },

// ════════════════════════════════════════════════════════════════════════════
// VECTORS & 3D GEOMETRY (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'VEC', d:'EASY', py:false,
  q:'The magnitude of vector 3î + 4ĵ is:',
  o:[{c:'5',ok:true},{c:'7',ok:false},{c:'3',ok:false},{c:'4',ok:false}],
  ex:'|3î + 4ĵ| = √(3²+4²) = √25 = 5.' },

{ ck:'VEC', d:'EASY', py:false,
  q:'The unit vector along î + ĵ is:',
  o:[{c:'(î + ĵ)/√2',ok:true},{c:'(î + ĵ)/2',ok:false},{c:'î + ĵ',ok:false},{c:'(î − ĵ)/√2',ok:false}],
  ex:'|î + ĵ| = √2. Unit vector = (î + ĵ)/√2.' },

{ ck:'VEC', d:'EASY', py:true,
  q:'Two vectors are perpendicular if their dot product is:',
  o:[{c:'0',ok:true},{c:'1',ok:false},{c:'−1',ok:false},{c:'Undefined',ok:false}],
  ex:'a⃗ ⊥ b⃗ ⟺ a⃗ · b⃗ = 0.' },

{ ck:'VEC', d:'EASY', py:false,
  q:'î × ĵ = ?',
  o:[{c:'k̂',ok:true},{c:'−k̂',ok:false},{c:'î',ok:false},{c:'ĵ',ok:false}],
  ex:'By the right-hand rule: î × ĵ = k̂.' },

{ ck:'VEC', d:'MEDIUM', py:false,
  q:'If a⃗ = î + 2ĵ + 3k̂ and b⃗ = 2î − ĵ + k̂, then a⃗ · b⃗ = ?',
  o:[{c:'3',ok:true},{c:'5',ok:false},{c:'−3',ok:false},{c:'7',ok:false}],
  ex:'a⃗ · b⃗ = (1)(2)+(2)(−1)+(3)(1) = 2−2+3 = 3.' },

{ ck:'VEC', d:'MEDIUM', py:true,
  q:'The angle between vectors î + ĵ and ĵ + k̂ is:',
  o:[{c:'60°',ok:true},{c:'90°',ok:false},{c:'45°',ok:false},{c:'30°',ok:false}],
  ex:'cos θ = [(î+ĵ)·(ĵ+k̂)] / (|î+ĵ||ĵ+k̂|) = 1/(√2·√2) = 1/2 → θ = 60°.' },

{ ck:'VEC', d:'MEDIUM', py:false,
  q:'The distance from point (1, 2, 3) to the origin is:',
  o:[{c:'√14',ok:true},{c:'√6',ok:false},{c:'√10',ok:false},{c:'3',ok:false}],
  ex:'Distance = √(1²+2²+3²) = √(1+4+9) = √14.' },

{ ck:'VEC', d:'MEDIUM', py:false,
  q:'|a⃗ + b⃗|² + |a⃗ − b⃗|² = ?',
  o:[{c:'2(|a⃗|² + |b⃗|²)',ok:true},{c:'4a⃗·b⃗',ok:false},{c:'|a⃗|² + |b⃗|²',ok:false},{c:'2a⃗·b⃗',ok:false}],
  ex:'|a+b|²=|a|²+2a·b+|b|² and |a−b|²=|a|²−2a·b+|b|². Sum = 2|a|²+2|b|².' },

{ ck:'VEC', d:'HARD', py:true,
  q:'If a⃗ = 2î+3ĵ−k̂ and b⃗ = î−ĵ+2k̂, then |a⃗ × b⃗| = ?',
  o:[{c:'√75 = 5√3',ok:true},{c:'5',ok:false},{c:'√50',ok:false},{c:'10',ok:false}],
  ex:'a⃗×b⃗ = |î ĵ k̂; 2 3 −1; 1 −1 2| = î(6−1)−ĵ(4+1)+k̂(−2−3) = 5î−5ĵ−5k̂. |a⃗×b⃗| = 5√3.' },

{ ck:'VEC', d:'HARD', py:false,
  q:'The area of a parallelogram with sides a⃗ = î + 2ĵ and b⃗ = 2î − ĵ is:',
  o:[{c:'5',ok:true},{c:'4',ok:false},{c:'3',ok:false},{c:'10',ok:false}],
  ex:'a⃗×b⃗ = |î ĵ k̂; 1 2 0; 2 −1 0| = k̂(−1−4) = −5k̂. Area = |a⃗×b⃗| = 5.' },

{ ck:'VEC', d:'HARD', py:false,
  q:'The equation of the line through point (1,2,3) with direction vector (2,3,4) in symmetric form is:',
  o:[{c:'(x−1)/2 = (y−2)/3 = (z−3)/4',ok:true},{c:'x/2 = y/3 = z/4',ok:false},{c:'(x+1)/2 = (y+2)/3 = (z+3)/4',ok:false},{c:'x−1 = y−2 = z−3',ok:false}],
  ex:'Symmetric form: (x−x₁)/l = (y−y₁)/m = (z−z₁)/n = (x−1)/2 = (y−2)/3 = (z−3)/4.' },

{ ck:'VEC', d:'HARD', py:true,
  q:'A plane passes through (1,0,0), (0,1,0), and (0,0,1). Its equation is:',
  o:[{c:'x + y + z = 1',ok:true},{c:'x + y + z = 3',ok:false},{c:'x + y + z = 0',ok:false},{c:'x/1 + y/1 + z/1 = 0',ok:false}],
  ex:'Using intercept form x/a+y/b+z/c=1 with a=b=c=1: x+y+z=1.' },

{ ck:'VEC', d:'EXPERT', py:false,
  q:'If three vectors a⃗, b⃗, c⃗ are coplanar, the scalar triple product [a⃗ b⃗ c⃗] = ?',
  o:[{c:'0',ok:true},{c:'1',ok:false},{c:'−1',ok:false},{c:'Cannot be determined',ok:false}],
  ex:'Three vectors are coplanar iff their scalar triple product (box product) a⃗·(b⃗×c⃗) = 0.' },

{ ck:'VEC', d:'EXPERT', py:true,
  q:'The shortest distance between lines r⃗ = λ(î+ĵ+k̂) and r⃗ = (−î)+μ(î+2ĵ+3k̂) is:',
  o:[{c:'1/√6',ok:true},{c:'1/√2',ok:false},{c:'1/√3',ok:false},{c:'1/2',ok:false}],
  ex:'n⃗=(d₁×d₂)=(î+ĵ+k̂)×(î+2ĵ+3k̂)=î(3−2)−ĵ(3−1)+k̂(2−1)=î−2ĵ+k̂. |n⃗|=√6. (a₂−a₁)=(−1,0,0). Distance=|(-1,0,0)·(1,−2,1)|/√6 = 1/√6.' },

{ ck:'VEC', d:'EXPERT', py:false,
  q:'If a⃗, b⃗, c⃗ form a right-handed orthonormal system, then a⃗·(b⃗×c⃗) = ?',
  o:[{c:'1',ok:true},{c:'0',ok:false},{c:'−1',ok:false},{c:'3',ok:false}],
  ex:'For a right-handed orthonormal (standard) basis: a⃗·(b⃗×c⃗) = volume of unit parallelepiped = 1.' },

{ ck:'VEC', d:'EXPERT', py:false,
  q:'The angle between the planes 2x + y − 2z = 5 and 3x − 6y − 2z = 7 is:',
  o:[{c:'cos⁻¹(4/21)',ok:true},{c:'cos⁻¹(1/7)',ok:false},{c:'90°',ok:false},{c:'cos⁻¹(2/3)',ok:false}],
  ex:'n₁=(2,1,−2), n₂=(3,−6,−2). cos θ = |n₁·n₂|/(|n₁||n₂|) = |6−6+4|/(3×7) = 4/21. θ = cos⁻¹(4/21).' },

// ════════════════════════════════════════════════════════════════════════════
// CALCULUS (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'CALC', d:'EASY', py:false,
  q:'lim(x→0) sin x / x = ?',
  o:[{c:'1',ok:true},{c:'0',ok:false},{c:'∞',ok:false},{c:'−1',ok:false}],
  ex:'Standard limit: lim(x→0) sin x/x = 1. (This is a fundamental result.)' },

{ ck:'CALC', d:'EASY', py:false,
  q:'The derivative of xⁿ with respect to x is:',
  o:[{c:'nxⁿ⁻¹',ok:true},{c:'xⁿ⁺¹/(n+1)',ok:false},{c:'nxⁿ',ok:false},{c:'xⁿ/n',ok:false}],
  ex:'Power rule: d/dx(xⁿ) = nxⁿ⁻¹.' },

{ ck:'CALC', d:'EASY', py:true,
  q:'∫x dx = ?',
  o:[{c:'x²/2 + C',ok:true},{c:'2x + C',ok:false},{c:'x² + C',ok:false},{c:'x/2 + C',ok:false}],
  ex:'∫x dx = x²/2 + C (power rule for integration: increase power by 1, divide by new power).' },

{ ck:'CALC', d:'EASY', py:false,
  q:'If f(x) = 3x² + 2x + 1, then f\'(x) = ?',
  o:[{c:'6x + 2',ok:true},{c:'3x + 2',ok:false},{c:'6x² + 2',ok:false},{c:'3x² + 2',ok:false}],
  ex:'f\'(x) = d/dx(3x²) + d/dx(2x) + d/dx(1) = 6x + 2 + 0 = 6x + 2.' },

{ ck:'CALC', d:'MEDIUM', py:true,
  q:'lim(x→2) (x² − 4)/(x − 2) = ?',
  o:[{c:'4',ok:true},{c:'2',ok:false},{c:'0',ok:false},{c:'∞',ok:false}],
  ex:'Factor: (x²−4)/(x−2) = (x+2)(x−2)/(x−2) = x+2 → as x→2: 2+2 = 4.' },

{ ck:'CALC', d:'MEDIUM', py:false,
  q:'d/dx(sin 2x) = ?',
  o:[{c:'2cos 2x',ok:true},{c:'cos 2x',ok:false},{c:'−2cos 2x',ok:false},{c:'sin 2x',ok:false}],
  ex:'Chain rule: d/dx(sin 2x) = cos(2x) · d/dx(2x) = 2cos 2x.' },

{ ck:'CALC', d:'MEDIUM', py:false,
  q:'∫₀¹ x² dx = ?',
  o:[{c:'1/3',ok:true},{c:'1/2',ok:false},{c:'1',ok:false},{c:'2/3',ok:false}],
  ex:'[x³/3]₀¹ = 1/3 − 0 = 1/3.' },

{ ck:'CALC', d:'MEDIUM', py:true,
  q:'lim(x→∞) (x+1)/x = ?',
  o:[{c:'1',ok:true},{c:'∞',ok:false},{c:'0',ok:false},{c:'−1',ok:false}],
  ex:'(x+1)/x = 1 + 1/x → 1 + 0 = 1 as x → ∞.' },

{ ck:'CALC', d:'HARD', py:true,
  q:'Find the local maximum value of f(x) = x³ − 3x + 2:',
  o:[{c:'4',ok:true},{c:'2',ok:false},{c:'3',ok:false},{c:'0',ok:false}],
  ex:'f\'(x) = 3x²−3 = 0 → x = ±1. f\'\'(x) = 6x. f\'\'(−1) = −6 < 0 → local max at x=−1. f(−1) = −1+3+2 = 4.' },

{ ck:'CALC', d:'HARD', py:false,
  q:'∫x·eˣ dx = ?',
  o:[{c:'eˣ(x−1) + C',ok:true},{c:'xeˣ + C',ok:false},{c:'eˣ(x+1) + C',ok:false},{c:'x²eˣ/2 + C',ok:false}],
  ex:'Integration by parts: u=x, dv=eˣdx → du=dx, v=eˣ. ∫xeˣdx = xeˣ − ∫eˣdx = xeˣ − eˣ + C = eˣ(x−1)+C.' },

{ ck:'CALC', d:'HARD', py:false,
  q:'The function f(x) = |x| is:',
  o:[{c:'Continuous but not differentiable at x = 0',ok:true},{c:'Differentiable everywhere',ok:false},{c:'Neither continuous nor differentiable at x=0',ok:false},{c:'Differentiable at x = 0',ok:false}],
  ex:'|x| is continuous everywhere. At x=0, left derivative = −1 ≠ right derivative = 1. Not differentiable at x=0.' },

{ ck:'CALC', d:'HARD', py:true,
  q:'If y = ln x, then d²y/dx² = ?',
  o:[{c:'−1/x²',ok:true},{c:'1/x',ok:false},{c:'−1/x',ok:false},{c:'1/x²',ok:false}],
  ex:'dy/dx = 1/x. d²y/dx² = d/dx(1/x) = −1/x².' },

{ ck:'CALC', d:'EXPERT', py:true,
  q:'∫₀^(π/2) sin²x dx = ?',
  o:[{c:'π/4',ok:true},{c:'π/2',ok:false},{c:'1/2',ok:false},{c:'π/8',ok:false}],
  ex:'Use identity: sin²x=(1−cos2x)/2. ∫₀^(π/2)(1−cos2x)/2 dx = [x/2−sin2x/4]₀^(π/2) = π/4.' },

{ ck:'CALC', d:'EXPERT', py:false,
  q:'Using L\'Hôpital\'s rule: lim(x→0) (eˣ−1)/x = ?',
  o:[{c:'1',ok:true},{c:'0',ok:false},{c:'e',ok:false},{c:'∞',ok:false}],
  ex:'0/0 form. Differentiate numerator and denominator: lim eˣ/1 = e⁰ = 1.' },

{ ck:'CALC', d:'EXPERT', py:false,
  q:'The area bounded by y = x², y = 0, x = 0, and x = 2 is:',
  o:[{c:'8/3',ok:true},{c:'4',ok:false},{c:'2',ok:false},{c:'4/3',ok:false}],
  ex:'∫₀² x² dx = [x³/3]₀² = 8/3.' },

{ ck:'CALC', d:'EXPERT', py:true,
  q:'If f(x) = x·sin x, find f\'(π/2):',
  o:[{c:'1',ok:true},{c:'π/2',ok:false},{c:'0',ok:false},{c:'−1',ok:false}],
  ex:'f\'(x) = sin x + x·cos x. f\'(π/2) = sin(π/2) + (π/2)cos(π/2) = 1 + (π/2)·0 = 1.' },

// ════════════════════════════════════════════════════════════════════════════
// PROBABILITY & STATISTICS (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'PROB', d:'EASY', py:false,
  q:'A coin is tossed twice. The probability of getting exactly one head is:',
  o:[{c:'1/2',ok:true},{c:'1/4',ok:false},{c:'3/4',ok:false},{c:'2/3',ok:false}],
  ex:'Sample space: {HH, HT, TH, TT}. Exactly one head: {HT, TH} = 2 outcomes. P = 2/4 = 1/2.' },

{ ck:'PROB', d:'EASY', py:false,
  q:'The mean of the dataset {5, 10, 15, 20, 25} is:',
  o:[{c:'15',ok:true},{c:'12',ok:false},{c:'18',ok:false},{c:'20',ok:false}],
  ex:'Mean = (5+10+15+20+25)/5 = 75/5 = 15.' },

{ ck:'PROB', d:'EASY', py:true,
  q:'A bag contains 3 red and 7 blue balls. The probability of picking a red ball is:',
  o:[{c:'3/10',ok:true},{c:'7/10',ok:false},{c:'3/7',ok:false},{c:'7/3',ok:false}],
  ex:'P(red) = 3/(3+7) = 3/10.' },

{ ck:'PROB', d:'EASY', py:false,
  q:'The median of the ordered dataset {3, 7, 9, 11, 15} is:',
  o:[{c:'9',ok:true},{c:'7',ok:false},{c:'11',ok:false},{c:'8',ok:false}],
  ex:'For 5 values, the median is the 3rd value in sorted order: 9.' },

{ ck:'PROB', d:'MEDIUM', py:true,
  q:'Two dice are rolled. The probability that the sum equals 7 is:',
  o:[{c:'1/6',ok:true},{c:'1/4',ok:false},{c:'1/12',ok:false},{c:'5/36',ok:false}],
  ex:'Favourable outcomes: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6. Total = 36. P = 6/36 = 1/6.' },

{ ck:'PROB', d:'MEDIUM', py:false,
  q:'If P(A) = 0.4 and P(B) = 0.3, and A and B are independent events, then P(A ∩ B) = ?',
  o:[{c:'0.12',ok:true},{c:'0.7',ok:false},{c:'0.28',ok:false},{c:'0.1',ok:false}],
  ex:'For independent events: P(A∩B) = P(A)·P(B) = 0.4 × 0.3 = 0.12.' },

{ ck:'PROB', d:'MEDIUM', py:false,
  q:'If P(A∪B) = 0.7, P(A) = 0.4 and P(B) = 0.5, then P(A∩B) = ?',
  o:[{c:'0.2',ok:true},{c:'0.3',ok:false},{c:'0.1',ok:false},{c:'0.5',ok:false}],
  ex:'P(A∩B) = P(A) + P(B) − P(A∪B) = 0.4 + 0.5 − 0.7 = 0.2.' },

{ ck:'PROB', d:'MEDIUM', py:true,
  q:'A random variable X has P(X=0) = 1/4, P(X=1) = 1/2, P(X=2) = 1/4. E(X) = ?',
  o:[{c:'1',ok:true},{c:'3/4',ok:false},{c:'3/2',ok:false},{c:'2',ok:false}],
  ex:'E(X) = 0·(1/4) + 1·(1/2) + 2·(1/4) = 0 + 0.5 + 0.5 = 1.' },

{ ck:'PROB', d:'HARD', py:true,
  q:'Box A has 2 red and 3 blue balls; Box B has 3 red and 2 blue. A box is chosen at random and a red ball is drawn. P(it came from Box B) = ?',
  o:[{c:'3/5',ok:true},{c:'2/5',ok:false},{c:'1/2',ok:false},{c:'3/10',ok:false}],
  ex:'P(R|A)=2/5, P(R|B)=3/5, P(A)=P(B)=1/2. P(B|R) = (3/5·1/2)/[(2/5·1/2)+(3/5·1/2)] = (3/10)/(5/10) = 3/5.' },

{ ck:'PROB', d:'HARD', py:false,
  q:'The standard deviation of the dataset {5, 5, 5, 5, 5} is:',
  o:[{c:'0',ok:true},{c:'5',ok:false},{c:'1',ok:false},{c:'25',ok:false}],
  ex:'All values equal the mean (5). Variance = 0. Standard deviation = √0 = 0.' },

{ ck:'PROB', d:'HARD', py:false,
  q:'If two events A and B are mutually exclusive with P(A)=0.3 and P(B)=0.4, then P(A∪B) = ?',
  o:[{c:'0.7',ok:true},{c:'0.12',ok:false},{c:'0.3',ok:false},{c:'0.58',ok:false}],
  ex:'Mutually exclusive: P(A∩B)=0. P(A∪B) = P(A)+P(B) = 0.3+0.4 = 0.7.' },

{ ck:'PROB', d:'HARD', py:true,
  q:'In a binomial distribution with n=10, p=0.5, the mean and variance are respectively:',
  o:[{c:'5 and 2.5',ok:true},{c:'5 and 5',ok:false},{c:'2.5 and 5',ok:false},{c:'5 and 10',ok:false}],
  ex:'Mean = np = 10×0.5 = 5. Variance = np(1−p) = 10×0.5×0.5 = 2.5.' },

{ ck:'PROB', d:'EXPERT', py:false,
  q:'If X follows a Poisson distribution with parameter λ, then P(X=0) = ?',
  o:[{c:'e^(−λ)',ok:true},{c:'λe^(−λ)',ok:false},{c:'1−e^(−λ)',ok:false},{c:'e^λ',ok:false}],
  ex:'Poisson PMF: P(X=k) = e^(−λ)·λᵏ/k!. For k=0: P(X=0) = e^(−λ).' },

{ ck:'PROB', d:'EXPERT', py:true,
  q:'The coefficient of variation (CV) is defined as:',
  o:[{c:'(σ/μ) × 100',ok:true},{c:'σ²',ok:false},{c:'μ/σ',ok:false},{c:'σ − μ',ok:false}],
  ex:'CV = (Standard Deviation / Mean) × 100. It expresses variability as a percentage of the mean.' },

{ ck:'PROB', d:'EXPERT', py:false,
  q:'If P(A|B) = 0.4 and P(B) = 0.5, and P(A) = 0.3, then P(B|A) = ?',
  o:[{c:'2/3',ok:true},{c:'0.4',ok:false},{c:'0.2',ok:false},{c:'0.5',ok:false}],
  ex:'P(A|B) = P(A∩B)/P(B) → P(A∩B) = 0.4×0.5=0.2. P(B|A) = P(A∩B)/P(A) = 0.2/0.3 = 2/3.' },

{ ck:'PROB', d:'EXPERT', py:false,
  q:'The probability that at least one of the events A, B occurs, given P(A)=0.5, P(B)=0.4, P(A∩B)=0.2 is:',
  o:[{c:'0.7',ok:true},{c:'0.9',ok:false},{c:'0.5',ok:false},{c:'0.6',ok:false}],
  ex:'P(A∪B) = P(A)+P(B)−P(A∩B) = 0.5+0.4−0.2 = 0.7.' },

];

// ─── REST API: Create MCQ ──────────────────────────────────────────────────────


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
  console.log(' NIMCET Mathematics — Part 2 (Chapters 7–11)');
  console.log('══════════════════════════════════════════\n');

  console.log('Looking up subject and chapter IDs via API…\n');
  const { subjectId, T } = await lookupSubjectAndTopics();

  console.log('Seeding MCQs for chapters 7–11 via API…\n');
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
  console.log('✓ Mathematics seeding complete!\n');
}

main().catch(console.error);

