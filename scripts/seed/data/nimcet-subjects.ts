/** NIMCET-exclusive subjects — its own aptitude-style paper structure, distinct enough
 * from GATE-CSE's engineering-depth CS subjects that nothing is shared between the two. */
import type { NodeDef } from '../lib/upsert';

export const nimcetSubjects: NodeDef[] = [
  {
    name: 'NIMCET Mathematics',
    children: [
      { name: 'Set Theory', children: [{ name: 'Sets and Venn Diagrams' }, { name: 'Relations and Functions' }] },
      { name: 'Algebra', children: [{ name: 'Quadratic Equations' }, { name: 'Sequences and Series' }, { name: 'Matrices' }] },
      { name: 'Calculus', children: [{ name: 'Limits and Continuity' }, { name: 'Differentiation' }, { name: 'Integration' }] },
      { name: 'Coordinate Geometry and Vectors' },
      { name: 'Trigonometry' },
      { name: 'Probability and Statistics' },
    ],
  },
  {
    name: 'Computer Awareness',
    children: [
      { name: 'Computer Fundamentals' },
      { name: 'Data Representation' },
      { name: 'Basics of Operating Systems' },
      { name: 'Basics of Networking' },
      { name: 'Basics of Databases' },
    ],
  },
  {
    name: 'Analytical Ability and Logical Reasoning',
    children: [{ name: 'Number Series and Coding-Decoding' }, { name: 'Logical Reasoning' }, { name: 'Data Interpretation' }],
  },
  {
    name: 'General English',
    children: [{ name: 'Vocabulary' }, { name: 'Grammar and Usage' }, { name: 'Reading Comprehension' }],
  },
];
