import type { MindMapNodeStyle, MindMapTreeNode } from '@/lib/mind-maps';

// Preview-only sample maps for the admin "Samples" page — never published or indexed.
// • Vice-President: text supplied by the product owner from their reference notes (Articles
//   63–71), used to check the classic print style. Verify before reusing as real content.
// • Parliament stress test: generated placeholder facts, only to check that a ~200-node map
//   stays readable with no overlaps.

interface Spec {
  label: string;
  hi?: string;
  style?: MindMapNodeStyle;
  tags?: string[];
  content?: string;
  children?: Spec[];
}

function build(specs: Spec[], prefix: string): MindMapTreeNode[] {
  return specs.map((s, i) => {
    const id = `${prefix}-${i}`;
    return {
      id,
      label: s.label,
      labelHi: s.hi ?? null,
      style: s.style ?? null,
      tags: s.tags ?? null,
      description: null,
      content: s.content ?? null,
      curriculumNodeId: null,
      children: build(s.children ?? [], id),
    };
  });
}

const heading = (label: string, hi?: string): Spec => ({ label, hi, style: { heading: true } });
const dashed = (label: string, hi?: string): Spec => ({ label, hi, style: { border: 'dashed' } });

export const VICE_PRESIDENT_SAMPLE = build(
  [
    { label: 'Article 63', hi: 'अनुच्छेद 63', children: [{ label: 'There shall be a Vice-President of India.' }] },
    {
      label: 'Article 64',
      hi: 'अनुच्छेद 64',
      children: [{ label: 'The Vice-President to be ex officio Chairman of the Council of States' }, { label: 'Shall not hold any other office of profit' }],
    },
    {
      label: 'Article 65',
      hi: 'अनुच्छेद 65',
      children: [{ label: 'The Vice-President to act as President or to discharge his functions during casual vacancies in the office, or during the absence, of President.' }],
    },
    {
      label: 'Article 66',
      hi: 'अनुच्छेद 66',
      children: [
        heading('Election of Vice-President', 'उपराष्ट्रपति का निर्वाचन'),
        { label: 'The Vice-President shall be elected by the members of both Houses of Parliament (All MPs)' },
        {
          label: 'Proportional Representative + Single Transferable Vote',
          style: { highlight: true },
          content: '- A person who votes has the power of multiple votes (preferences).\n- Nomination: 20 proposers + 20 seconders.',
        },
        { label: 'The Vice-President shall not be a member of either House of Parliament or a House of the Legislature of any State' },
        {
          label: 'Eligible for election as Vice-President',
          tags: ['Important'],
          children: [
            dashed('Citizen of India', 'भारत का नागरिक'),
            dashed('Completed the age of 35 years', '35 वर्ष की आयु पूरी कर चुका हो'),
            dashed('Qualified for election as a member of Rajya Sabha', 'राज्यसभा का सदस्य निर्वाचित होने के योग्य'),
          ],
        },
        { label: 'Should not hold any office of profit under the Government of India or the Government of any State' },
      ],
    },
    {
      label: 'Article 67',
      hi: 'अनुच्छेद 67',
      children: [
        heading('Term of office of Vice-President', 'उपराष्ट्रपति की पदावधि'),
        { label: 'The Vice-President shall hold office for a term of five years' },
        { label: 'Resignation to the President' },
        { label: 'May be removed by a resolution of the Council of States passed by a majority of all the then members and agreed to by the House of the People' },
        { label: 'Shall continue to hold office until his successor enters his office' },
      ],
    },
    {
      label: 'Article 68',
      hi: 'अनुच्छेद 68',
      children: [
        heading('Time of holding election to fill vacancy'),
        { label: 'Election to fill a vacancy shall be completed before the expiration of the term' },
        { label: 'Vacancy due to death, resignation or removal → election held within 60 days' },
      ],
    },
    { label: 'Article 69', hi: 'अनुच्छेद 69', children: [{ label: 'Oath or affirmation by the Vice-President, made and subscribed before the President' }] },
    { label: 'Article 70', hi: 'अनुच्छेद 70', children: [{ label: "Discharge of President's functions in other contingencies" }] },
    {
      label: 'Article 71',
      hi: 'अनुच्छेद 71',
      children: [heading('Matters relating to the election of a President or Vice-President'), { label: 'All doubts & disputes shall be inquired into & decided by the Supreme Court only' }],
    },
  ],
  'vp',
);

/** 45 articles (79–123) × 2–5 placeholder facts of varying length — layout stress test only. */
export const PARLIAMENT_STRESS_SAMPLE = build(
  Array.from({ length: 45 }, (_, k): Spec => {
    const article = 79 + k;
    return {
      label: `Article ${article}`,
      children: Array.from({ length: 2 + ((k * 7) % 4) }, (_, i) => ({
        label: `Placeholder fact ${i + 1} for Article ${article}${' — sample text to test wrapping of longer leaves'.slice(0, 8 + ((article * 13 + i * 29) % 52))}`,
      })),
    };
  }),
  'parl',
);

export const MIND_MAP_SAMPLES = [
  { id: 'vice-president', name: 'Vice-President (Articles 63–71)', subject: 'Indian Polity', chapter: 'Vice-President', nodes: VICE_PRESIDENT_SAMPLE },
  { id: 'parliament', name: 'Parliament stress test (≈200 nodes)', subject: 'Indian Polity', chapter: 'Parliament', nodes: PARLIAMENT_STRESS_SAMPLE },
] as const;
