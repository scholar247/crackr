/**
 * Board/CUET-exclusive subjects. `cbse12CuetSubjects` combines with shared-subjects'
 * physics/chemistry/mathematicsCore/biology in the CUET-UG and CBSE Class 12 scripts —
 * CUET-UG's domain subjects ARE the CBSE Class 12 subjects (CUET tests the 12th-grade
 * NCERT syllabus directly), so those two scripts share their entire subject list.
 * `cbseClass10Subjects` is a distinct, standalone stage — nothing here is shared with
 * the 12th-grade subjects above (different depth, and "Mathematics"/"English" would
 * otherwise collide by name with the shared Class-11/12 subjects of the same name).
 */
import type { NodeDef } from '../lib/upsert';

export const cbse12CuetSubjects: NodeDef[] = [
  {
    name: 'English',
    children: [{ name: 'Reading Comprehension' }, { name: 'Grammar and Vocabulary' }, { name: 'Writing Skills' }],
  },
  {
    name: 'Economics',
    children: [{ name: 'Introductory Microeconomics' }, { name: 'Introductory Macroeconomics' }, { name: 'Indian Economic Development' }],
  },
  {
    name: 'Business Studies',
    children: [{ name: 'Principles and Functions of Management' }, { name: 'Business Environment' }, { name: 'Marketing and Consumer Protection' }],
  },
  {
    name: 'Computer Science',
    children: [{ name: 'Programming in Python' }, { name: 'Data Structures' }, { name: 'Database Management' }, { name: 'Computer Networks' }],
  },
];

export const cbseClass10Subjects: NodeDef[] = [
  {
    name: 'Science (Class 10)',
    children: [
      { name: 'Chemical Reactions and Equations' },
      { name: 'Life Processes' },
      { name: 'Light: Reflection and Refraction' },
      { name: 'Electricity' },
      { name: 'Magnetic Effects of Electric Current' },
    ],
  },
  {
    name: 'Mathematics (Class 10)',
    children: [
      { name: 'Real Numbers' },
      { name: 'Polynomials' },
      { name: 'Pair of Linear Equations in Two Variables' },
      { name: 'Quadratic Equations' },
      { name: 'Trigonometry' },
      { name: 'Circles' },
    ],
  },
  {
    name: 'Social Science (Class 10)',
    children: [
      { name: 'Nationalism in India' },
      { name: 'Resources and Development' },
      { name: 'Power Sharing' },
      { name: 'Development' },
    ],
  },
  {
    name: 'English (Class 10)',
    children: [{ name: 'Literature Reader' }, { name: 'Grammar' }, { name: 'Writing Skills' }],
  },
];
