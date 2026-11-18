import type { NodeDef } from '../lib/upsert';

/**
 * Topic / subtopic structure for selected CBSE Class 10 chapters, taken from the section
 * headings of the NCERT textbooks (2023-24 rationalised editions) — names only, no
 * descriptions, so nothing beyond the official structure is added. Keyed by chapter name
 * exactly as it appears in board-subjects.ts.
 *
 * Curriculum nodes are global and keyed by slug (see lib/upsert.ts), so every name here
 * was checked against existing nodes before seeding; seed-class-10-topics.ts refuses to
 * attach a topic whose slug already belongs to a node with children elsewhere.
 */
export const CBSE_CLASS_10_TOPICS: Record<string, NodeDef[]> = {
  'Life Processes': [
    { name: 'What are Life Processes?' },
    {
      name: 'Nutrition (Life Processes)',
      children: [{ name: 'Autotrophic Nutrition' }, { name: 'Heterotrophic Nutrition' }, { name: 'How do Organisms obtain their Nutrition?' }, { name: 'Nutrition in Human Beings' }],
    },
    { name: 'Respiration (Life Processes)', children: [{ name: 'Aerobic and Anaerobic Respiration' }, { name: 'Human Respiratory System' }] },
    { name: 'Transportation (Life Processes)', children: [{ name: 'Transportation in Human Beings' }, { name: 'Transportation in Plants' }] },
    { name: 'Excretion (Life Processes)', children: [{ name: 'Excretion in Human Beings' }, { name: 'Excretion in Plants' }] },
  ],
  Electricity: [
    { name: 'Electric Current and Circuit' },
    { name: 'Electric Potential and Potential Difference' },
    { name: 'Circuit Diagram' },
    { name: "Ohm's Law (Class 10)" },
    { name: 'Factors on which the Resistance of a Conductor Depends' },
    { name: 'Resistance of a System of Resistors', children: [{ name: 'Resistors in Series' }, { name: 'Resistors in Parallel' }] },
    { name: 'Heating Effect of Electric Current', children: [{ name: 'Practical Applications of Heating Effect of Electric Current' }] },
    { name: 'Electric Power (Class 10)' },
  ],
  'Chemical Reactions and Equations': [
    { name: 'Chemical Equations', children: [{ name: 'Writing a Chemical Equation' }, { name: 'Balanced Chemical Equations' }] },
    {
      name: 'Types of Chemical Reactions',
      children: [
        { name: 'Combination Reaction' },
        { name: 'Decomposition Reaction' },
        { name: 'Displacement Reaction' },
        { name: 'Double Displacement Reaction' },
        { name: 'Oxidation and Reduction' },
      ],
    },
    { name: 'Effects of Oxidation Reactions in Everyday Life', children: [{ name: 'Corrosion' }, { name: 'Rancidity' }] },
  ],
  'Light: Reflection and Refraction': [
    { name: 'Reflection of Light' },
    {
      name: 'Spherical Mirrors',
      children: [
        { name: 'Image Formation by Spherical Mirrors' },
        { name: 'Ray Diagrams for Spherical Mirrors' },
        { name: 'Sign Convention for Reflection by Spherical Mirrors' },
        { name: 'Mirror Formula and Magnification' },
      ],
    },
    {
      name: 'Refraction of Light',
      children: [
        { name: 'Refraction through a Rectangular Glass Slab' },
        { name: 'The Refractive Index' },
        { name: 'Refraction by Spherical Lenses' },
        { name: 'Image Formation by Lenses' },
        { name: 'Ray Diagrams for Lenses' },
        { name: 'Sign Convention for Spherical Lenses' },
        { name: 'Lens Formula and Magnification' },
        { name: 'Power of a Lens' },
      ],
    },
  ],
  'Real Numbers': [
    { name: 'The Fundamental Theorem of Arithmetic', children: [{ name: 'Prime Factorisation' }, { name: 'HCF and LCM by Prime Factorisation' }] },
    { name: 'Revisiting Irrational Numbers', children: [{ name: 'Proving Irrationality of Numbers' }] },
  ],
  'Pair of Linear Equations in Two Variables': [
    { name: 'Graphical Method of Solution' },
    { name: 'Algebraic Methods of Solving a Pair of Linear Equations', children: [{ name: 'Substitution Method' }, { name: 'Elimination Method' }] },
  ],
};
