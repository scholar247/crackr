/**
 * Demonstrates bulk MCQ seeding straight against the repository (same convention as
 * scripts/seed/exams/*.ts) — no HTTP round trip needed for a local/CI seed run. The same
 * data could equally be POSTed to /api/v1/admin/questions with an `x-api-key` header
 * matching SEED_API_KEY; that route uses the exact same questionRepository.create()
 * under the hood, so both paths behave identically (draft by default, same ancestor
 * node tagging).
 *
 * Run: npx tsx --env-file=.env.development scripts/seed/questions/nimcet-set-theory.ts
 */
import { questionRepository } from '@/server/repositories/question.repository';
import { taxonomyRepository } from '@/server/repositories/taxonomy.repository';

async function main() {
  const [exam, node] = await Promise.all([
    taxonomyRepository.findExamBySlug('nimcet'),
    taxonomyRepository.findNodeBySlug('sets-and-venn-diagrams'),
  ]);
  if (!exam) throw new Error('NIMCET exam not found — run scripts/seed/exams/nimcet.ts first');
  if (!node) throw new Error('"Sets and Venn Diagrams" node not found — run scripts/seed/exams/nimcet.ts first');

  const question = await questionRepository.create(
    {
      stem: 'If A and B are two sets such that n(A) = 70, n(B) = 60 and n(A ∪ B) = 110, then find n(A ∩ B).',
      options: [
        { key: 'A', text: '10', isCorrect: false },
        { key: 'B', text: '20', isCorrect: true },
        { key: 'C', text: '30', isCorrect: false },
        { key: 'D', text: '40', isCorrect: false },
      ],
      explanation:
        'By the inclusion-exclusion principle: n(A ∩ B) = n(A) + n(B) − n(A ∪ B) = 70 + 60 − 110 = 20.',
      difficulty: 'MEDIUM',
      tags: ['Set Theory', '2026 Pattern'],
      nodeId: node.id,
      examIds: [exam.id],
    },
    null // seeded, not authored by a real user — same convention as the API-key path
  );

  console.log('Created question:', question?.id, '— status:', question?.status);
  console.log('Tagged at:', question?.primaryNode?.nodeName, '(+', question?.ancestorNodes.length, 'ancestor tags)');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
