/**
 * Loads the sample dataset from the decision-analysis ERD doc (JEE Advanced + NIMCET,
 * sharing Mathematics/Algebra/Calculus/Quadratic Equations across both exams) so the
 * schema can be validated end-to-end. Safe to re-run — every insert is keyed by slug.
 *
 * Run: npm run db:seed
 */
import { db } from '@/server/db/client';
import { programs, exams, curriculumNodes, curriculumEdges, examNodeMap, questions, articles, contentNodeMap, contentExamMap } from '@/server/db/schema';
import { slugify } from '@/lib/utils';
import { eq } from 'drizzle-orm';

type NodeType = 'SUBJECT' | 'CHAPTER' | 'TOPIC' | 'SUBTOPIC';

async function upsertProgram(name: string, description: string) {
  const slug = slugify(name);
  const [existing] = await db.select().from(programs).where(eq(programs.slug, slug)).limit(1);
  if (existing) return existing;
  const [row] = await db.insert(programs).values({ name, slug, description }).returning();
  return row;
}

async function upsertExam(programId: string, name: string, description: string) {
  const slug = slugify(name);
  const [existing] = await db.select().from(exams).where(eq(exams.slug, slug)).limit(1);
  if (existing) return existing;
  const [row] = await db.insert(exams).values({ programId, name, slug, description }).returning();
  return row;
}

async function upsertNode(nodeType: NodeType, name: string, parentSlug?: string, nodesBySlug?: Map<string, string>) {
  const slug = slugify(name);
  let node = (await db.select().from(curriculumNodes).where(eq(curriculumNodes.slug, slug)).limit(1))[0];
  if (!node) {
    [node] = await db.insert(curriculumNodes).values({ nodeType, name, slug }).returning();
  }
  if (parentSlug && nodesBySlug) {
    const parentId = nodesBySlug.get(parentSlug)!;
    const existingEdge = await db
      .select()
      .from(curriculumEdges)
      .where(eq(curriculumEdges.parentNodeId, parentId))
      .then((rows) => rows.find((r) => r.childNodeId === node.id));
    if (!existingEdge) {
      await db.insert(curriculumEdges).values({ parentNodeId: parentId, childNodeId: node.id, sortOrder: 0 });
    }
  }
  nodesBySlug?.set(slug, node.id);
  return node;
}

async function mapExamNode(examId: string, nodeId: string) {
  await db.insert(examNodeMap).values({ examId, nodeId }).onConflictDoNothing();
}

async function main() {
  console.log('Seeding programs & exams…');
  const engProgram = await upsertProgram('Engineering Entrance', 'UG engineering entrance exams (B.Tech)');
  const mcaProgram = await upsertProgram('MCA Entrance', 'PG MCA entrance exams');

  const jeeAdvanced = await upsertExam(engProgram.id, 'JEE Advanced', 'IIT admission exam (after JEE Main)');
  const nimcet = await upsertExam(mcaProgram.id, 'NIMCET', 'NIT MCA Common Entrance Test');

  console.log('Seeding curriculum nodes…');
  const bySlug = new Map<string, string>();

  const mathematics = await upsertNode('SUBJECT', 'Mathematics', undefined, bySlug);
  const physics = await upsertNode('SUBJECT', 'Physics', undefined, bySlug);
  const computerScience = await upsertNode('SUBJECT', 'Computer Science', undefined, bySlug);

  const algebra = await upsertNode('CHAPTER', 'Algebra', mathematics.slug, bySlug);
  const calculus = await upsertNode('CHAPTER', 'Calculus', mathematics.slug, bySlug);
  const mechanics = await upsertNode('CHAPTER', 'Mechanics', physics.slug, bySlug);
  const probabilityStats = await upsertNode('CHAPTER', 'Probability & Statistics', mathematics.slug, bySlug);
  const dataStructures = await upsertNode('CHAPTER', 'Data Structures', computerScience.slug, bySlug);
  const algorithms = await upsertNode('CHAPTER', 'Algorithms', computerScience.slug, bySlug);

  const quadraticEquations = await upsertNode('TOPIC', 'Quadratic Equations', algebra.slug, bySlug);
  const complexNumbers = await upsertNode('TOPIC', 'Complex Numbers', algebra.slug, bySlug);
  await upsertNode('TOPIC', 'Limits & Continuity', calculus.slug, bySlug);
  await upsertNode('TOPIC', 'Differentiation', calculus.slug, bySlug);
  await upsertNode('TOPIC', "Newton's Laws", mechanics.slug, bySlug);
  await upsertNode('TOPIC', 'Linear Algebra', algebra.slug, bySlug);
  const bayesTheorem = await upsertNode('TOPIC', 'Bayes Theorem', probabilityStats.slug, bySlug);
  const integration = await upsertNode('TOPIC', 'Integration', calculus.slug, bySlug);
  const trees = await upsertNode('TOPIC', 'Trees', dataStructures.slug, bySlug);
  const graphs = await upsertNode('TOPIC', 'Graphs', dataStructures.slug, bySlug);
  await upsertNode('TOPIC', 'Sorting Algorithms', algorithms.slug, bySlug);

  await upsertNode('SUBTOPIC', 'Nature of Roots', quadraticEquations.slug, bySlug);
  await upsertNode('SUBTOPIC', "Vieta's Formulas", quadraticEquations.slug, bySlug);
  await upsertNode('SUBTOPIC', 'Binary Trees', trees.slug, bySlug);
  const bfsDfs = await upsertNode('SUBTOPIC', 'BFS & DFS', graphs.slug, bySlug);

  console.log('Mapping exam <-> syllabus nodes…');
  const jeeAdvNodeSlugs = [
    'mathematics', 'physics', 'algebra', 'calculus', 'mechanics',
    'quadratic-equations', 'complex-numbers', 'limits-continuity', 'differentiation',
    'newtons-laws', 'nature-of-roots', 'vietas-formulas',
  ];
  const nimcetNodeSlugs = [
    'mathematics', 'computer-science', 'algebra', 'calculus', 'probability-statistics',
    'data-structures', 'algorithms', 'quadratic-equations', 'linear-algebra', 'bayes-theorem',
    'integration', 'trees', 'graphs', 'sorting-algorithms', 'binary-trees', 'bfs-dfs',
  ];
  for (const slug of jeeAdvNodeSlugs) await mapExamNode(jeeAdvanced.id, bySlug.get(slug)!);
  for (const slug of nimcetNodeSlugs) await mapExamNode(nimcet.id, bySlug.get(slug)!);

  console.log('Seeding sample questions…');
  const questionSeeds = [
    {
      stem: 'If α, β are roots of x²−5x+6=0, find α²+β²',
      options: [
        { key: 'A', text: '11', isCorrect: false },
        { key: 'B', text: '13', isCorrect: true },
        { key: 'C', text: '15', isCorrect: false },
        { key: 'D', text: '17', isCorrect: false },
      ],
      explanation: 'Use identity: α²+β² = (α+β)² − 2αβ = 25−12 = 13',
      difficulty: 'MEDIUM' as const,
      nodeSlug: quadraticEquations.slug,
      examIds: [jeeAdvanced.id, nimcet.id],
    },
    {
      stem: 'For z ∈ ℂ, if |z−1| = |z+1|, z lies on?',
      options: [
        { key: 'A', text: 'x-axis', isCorrect: false },
        { key: 'B', text: 'y-axis', isCorrect: true },
        { key: 'C', text: 'unit circle', isCorrect: false },
        { key: 'D', text: 'line y=x', isCorrect: false },
      ],
      explanation: 'Perpendicular bisector of (1,0) and (−1,0) → y-axis',
      difficulty: 'HARD' as const,
      nodeSlug: complexNumbers.slug,
      examIds: [jeeAdvanced.id],
    },
    {
      stem: 'Time complexity of BFS on graph (V vertices, E edges)?',
      options: [
        { key: 'A', text: 'O(V)', isCorrect: false },
        { key: 'B', text: 'O(E)', isCorrect: false },
        { key: 'C', text: 'O(V + E)', isCorrect: true },
        { key: 'D', text: 'O(VE)', isCorrect: false },
      ],
      explanation: 'O(V + E)',
      difficulty: 'EASY' as const,
      nodeSlug: graphs.slug,
      examIds: [nimcet.id],
    },
    {
      stem: 'P(A|B) given P(B|A)=0.8, P(A)=0.5, P(B)=0.4?',
      options: [
        { key: 'A', text: '0.4', isCorrect: false },
        { key: 'B', text: '0.8', isCorrect: false },
        { key: 'C', text: '1.0', isCorrect: true },
        { key: 'D', text: '0.2', isCorrect: false },
      ],
      explanation: 'Bayes: (0.8×0.5)/0.4 = 1.0',
      difficulty: 'MEDIUM' as const,
      nodeSlug: bayesTheorem.slug,
      examIds: [nimcet.id],
    },
    {
      stem: 'Evaluate ∫₀^π sin²x dx',
      options: [
        { key: 'A', text: 'π/4', isCorrect: false },
        { key: 'B', text: 'π/2', isCorrect: true },
        { key: 'C', text: 'π', isCorrect: false },
        { key: 'D', text: '2π', isCorrect: false },
      ],
      explanation: '= π/2 (using reduction formula)',
      difficulty: 'HARD' as const,
      nodeSlug: integration.slug,
      examIds: [jeeAdvanced.id, nimcet.id],
    },
  ];

  for (const q of questionSeeds) {
    const [existing] = await db.select().from(questions).where(eq(questions.stem, q.stem)).limit(1);
    const question =
      existing ??
      (
        await db
          .insert(questions)
          .values({
            questionType: 'MCQ',
            stem: q.stem,
            optionsJson: q.options,
            explanation: q.explanation,
            difficulty: q.difficulty,
            status: 'PUBLISHED',
            visibility: 'PUBLIC',
          })
          .returning()
      )[0];

    await db
      .insert(contentNodeMap)
      .values({ contentType: 'QUESTION', contentId: question.id, nodeId: bySlug.get(q.nodeSlug)!, relationType: 'PRIMARY' })
      .onConflictDoNothing();
    for (const examId of q.examIds) {
      await db
        .insert(contentExamMap)
        .values({ contentType: 'QUESTION', contentId: question.id, examId, relationType: 'PRIMARY' })
        .onConflictDoNothing();
    }
  }

  console.log('Seeding sample articles…');
  const articleSeeds = [
    {
      title: 'Mastering Quadratic Equations',
      summary: 'Complete guide to solving quadratic equations, from factoring to the discriminant.',
      body: '## Mastering Quadratic Equations\n\nA quadratic equation has the form `ax² + bx + c = 0`. This guide walks through factoring, completing the square, and the quadratic formula.',
      nodeSlug: quadraticEquations.slug,
      examIds: [jeeAdvanced.id, nimcet.id],
    },
    {
      title: 'Graph Traversal: BFS vs DFS',
      summary: 'When to use breadth-first vs depth-first search, with complexity trade-offs.',
      body: '## BFS vs DFS\n\nBFS explores level by level using a queue; DFS explores as deep as possible using a stack (or recursion) before backtracking.',
      nodeSlug: bfsDfs.slug,
      examIds: [nimcet.id],
    },
    {
      title: 'Bayes Theorem Intuition',
      summary: 'A visual, intuitive explanation of conditional probability and Bayes theorem.',
      body: "## Bayes Theorem\n\nBayes theorem lets you update a probability estimate as new evidence arrives: `P(A|B) = P(B|A) * P(A) / P(B)`.",
      nodeSlug: bayesTheorem.slug,
      examIds: [nimcet.id],
    },
  ];

  for (const a of articleSeeds) {
    const slug = slugify(a.title);
    const [existing] = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
    const article =
      existing ??
      (
        await db
          .insert(articles)
          .values({ title: a.title, slug, summary: a.summary, body: a.body, status: 'PUBLISHED', visibility: 'PUBLIC' })
          .returning()
      )[0];

    await db
      .insert(contentNodeMap)
      .values({ contentType: 'ARTICLE', contentId: article.id, nodeId: bySlug.get(a.nodeSlug)!, relationType: 'PRIMARY' })
      .onConflictDoNothing();
    for (const examId of a.examIds) {
      await db
        .insert(contentExamMap)
        .values({ contentType: 'ARTICLE', contentId: article.id, examId, relationType: 'PRIMARY' })
        .onConflictDoNothing();
    }
  }

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
