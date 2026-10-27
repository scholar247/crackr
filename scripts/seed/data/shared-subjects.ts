/**
 * Subject trees shared across multiple exams — the actual point of a shared taxonomy.
 * Physics/Chemistry are reused by every PCM and PCB exam (JEE Main/Advanced/UPSEE test
 * the same NCERT-based syllabus as NEET/AIIMS/JIPMER, and CBSE Class 12/CUET-UG are the
 * literal source of that syllabus). Mathematics is reused by the PCM group plus
 * CBSE-12/CUET (not the PCB group — NEET doesn't test Math). Biology is reused by the PCB
 * group plus CBSE-12/CUET. Engineering Mathematics and Digital Logic are reused across
 * the two GATE papers, whose syllabi standardize both sections across disciplines.
 */
import type { NodeDef } from '../lib/upsert';

export const physics: NodeDef = {
  name: 'Physics',
  description: 'Mechanics, thermodynamics, electrodynamics, optics and modern physics.',
  children: [
    {
      name: 'Mechanics',
      children: [
        {
          name: 'Kinematics',
          children: [{ name: 'Motion in a Straight Line' }, { name: 'Motion in a Plane' }, { name: 'Projectile Motion' }],
        },
        { name: 'Laws of Motion' },
        { name: 'Work, Energy and Power' },
        { name: 'Rotational Motion' },
        { name: 'Gravitation' },
      ],
    },
    {
      name: 'Thermodynamics',
      children: [{ name: 'Laws of Thermodynamics' }, { name: 'Kinetic Theory of Gases' }, { name: 'Heat Transfer' }],
    },
    {
      name: 'Electrodynamics',
      children: [
        { name: 'Electrostatics' },
        { name: 'Current Electricity' },
        { name: 'Magnetic Effects of Current' },
        { name: 'Electromagnetic Induction' },
      ],
    },
    { name: 'Optics', children: [{ name: 'Ray Optics' }, { name: 'Wave Optics' }] },
    {
      name: 'Modern Physics',
      children: [{ name: 'Photoelectric Effect' }, { name: 'Atomic Structure' }, { name: 'Nuclear Physics' }],
    },
  ],
};

export const chemistry: NodeDef = {
  name: 'Chemistry',
  description: 'Physical, organic and inorganic chemistry.',
  children: [
    {
      name: 'Physical Chemistry',
      children: [
        { name: 'Atomic Structure' },
        { name: 'Chemical Bonding' },
        { name: 'Chemical Thermodynamics' },
        { name: 'Chemical Equilibrium' },
        { name: 'Electrochemistry' },
      ],
    },
    {
      name: 'Organic Chemistry',
      children: [
        { name: 'Hydrocarbons' },
        { name: 'Alcohols, Phenols and Ethers' },
        { name: 'Aldehydes, Ketones and Carboxylic Acids' },
        { name: 'Biomolecules' },
      ],
    },
    {
      name: 'Inorganic Chemistry',
      children: [
        { name: 'Periodic Table and Periodicity' },
        { name: 's-Block Elements' },
        { name: 'p-Block Elements' },
        { name: 'Coordination Compounds' },
      ],
    },
  ],
};

export const mathematicsCore: NodeDef = {
  name: 'Mathematics',
  description: 'Algebra, calculus, coordinate geometry, trigonometry, vectors and 3D geometry.',
  children: [
    {
      name: 'Algebra',
      children: [
        { name: 'Quadratic Equations' },
        { name: 'Sequences and Series' },
        { name: 'Permutations and Combinations' },
        { name: 'Matrices and Determinants' },
        { name: 'Complex Numbers' },
      ],
    },
    {
      name: 'Calculus',
      children: [
        { name: 'Limits and Continuity' },
        { name: 'Differentiation' },
        { name: 'Integration' },
        { name: 'Differential Equations' },
      ],
    },
    {
      name: 'Coordinate Geometry',
      children: [{ name: 'Straight Lines' }, { name: 'Circles' }, { name: 'Conic Sections' }],
    },
    {
      name: 'Trigonometry',
      children: [{ name: 'Trigonometric Ratios and Identities' }, { name: 'Inverse Trigonometric Functions' }],
    },
    {
      name: 'Vectors and 3D Geometry',
      children: [{ name: 'Vector Algebra' }, { name: 'Three Dimensional Geometry' }],
    },
  ],
};

export const biology: NodeDef = {
  name: 'Biology',
  description: 'Diversity of life, cell biology, plant and human physiology, genetics and ecology.',
  children: [
    {
      name: 'Diversity in Living World',
      children: [{ name: 'Classification of Living Organisms' }, { name: 'Plant Kingdom' }, { name: 'Animal Kingdom' }],
    },
    {
      name: 'Cell Structure and Function',
      children: [{ name: 'Cell Theory and Cell Types' }, { name: 'Biomolecules' }, { name: 'Cell Division' }],
    },
    {
      name: 'Plant Physiology',
      children: [{ name: 'Photosynthesis' }, { name: 'Respiration in Plants' }, { name: 'Plant Growth and Development' }],
    },
    {
      name: 'Human Physiology',
      children: [
        { name: 'Digestion and Absorption' },
        { name: 'Breathing and Exchange of Gases' },
        { name: 'Body Fluids and Circulation' },
        { name: 'Excretory Products and Elimination' },
        { name: 'Neural Control and Coordination' },
      ],
    },
    {
      name: 'Genetics and Evolution',
      children: [{ name: 'Principles of Inheritance' }, { name: 'Molecular Basis of Inheritance' }, { name: 'Evolution' }],
    },
    {
      name: 'Ecology and Environment',
      children: [{ name: 'Organisms and Populations' }, { name: 'Ecosystems' }, { name: 'Biodiversity and Conservation' }],
    },
  ],
};

export const engineeringMathematics: NodeDef = {
  name: 'Engineering Mathematics',
  description: 'The standardized mathematics section common across GATE engineering papers.',
  children: [
    {
      name: 'Linear Algebra',
      children: [{ name: 'Matrices' }, { name: 'Determinants' }, { name: 'Eigenvalues and Eigenvectors' }],
    },
    {
      name: 'Calculus',
      children: [
        { name: 'Limits and Continuity' },
        { name: 'Differentiation and Applications' },
        { name: 'Integration and Applications' },
      ],
    },
    {
      name: 'Probability and Statistics',
      children: [{ name: 'Probability Distributions' }, { name: 'Mean, Median, Mode' }, { name: 'Conditional Probability' }],
    },
    {
      name: 'Differential Equations',
      children: [{ name: 'First Order Differential Equations' }, { name: 'Higher Order Linear Differential Equations' }],
    },
  ],
};

export const digitalLogic: NodeDef = {
  name: 'Digital Logic',
  description: 'Number systems, Boolean algebra, combinational and sequential circuits.',
  children: [
    { name: 'Number Systems', children: [{ name: 'Number Base Conversion' }, { name: 'Binary Arithmetic' }] },
    {
      name: 'Boolean Algebra',
      children: [{ name: 'Logic Gates' }, { name: 'Boolean Function Simplification' }, { name: 'Karnaugh Maps' }],
    },
    {
      name: 'Combinational Circuits',
      children: [
        { name: 'Adders and Subtractors' },
        { name: 'Multiplexers and Demultiplexers' },
        { name: 'Encoders and Decoders' },
      ],
    },
    {
      name: 'Sequential Circuits',
      children: [{ name: 'Flip Flops' }, { name: 'Counters' }, { name: 'Registers' }],
    },
  ],
};
