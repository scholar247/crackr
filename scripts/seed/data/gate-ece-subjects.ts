/** GATE-ECE-exclusive subjects — combined with shared-subjects' engineeringMathematics
 * and digitalLogic (both standardized across GATE papers) in scripts/seed/exams/gate-ece.ts. */
import type { NodeDef } from '../lib/upsert';

export const gateEceSubjects: NodeDef[] = [
  {
    name: 'Network Theory',
    children: [
      { name: 'Circuit Elements and Laws' },
      { name: 'Network Theorems', children: [{ name: 'Thevenin and Norton Theorems' }, { name: 'Superposition Theorem' }] },
      { name: 'Transient Analysis' },
      { name: 'Two Port Networks' },
    ],
  },
  {
    name: 'Signals and Systems',
    children: [
      { name: 'Continuous Time Signals and Systems' },
      { name: 'Discrete Time Signals and Systems' },
      { name: 'Fourier Series and Transform' },
      { name: 'Laplace and Z Transform' },
    ],
  },
  {
    name: 'Electronic Devices',
    children: [
      { name: 'Semiconductor Physics' },
      { name: 'Diodes and Applications' },
      { name: 'Bipolar Junction Transistors' },
      { name: 'MOSFETs' },
    ],
  },
  {
    name: 'Analog Circuits',
    children: [{ name: 'Diode Circuits' }, { name: 'Amplifier Circuits' }, { name: 'Oscillators' }, { name: 'Operational Amplifiers' }],
  },
  {
    name: 'Control Systems',
    children: [
      { name: 'Basics of Control Systems' },
      { name: 'Time Response Analysis' },
      { name: 'Frequency Response Analysis' },
      { name: 'Stability Analysis' },
    ],
  },
  {
    name: 'Communication Systems',
    children: [{ name: 'Analog Communication' }, { name: 'Digital Communication' }, { name: 'Information Theory and Coding' }],
  },
  {
    name: 'Electromagnetics',
    children: [
      { name: 'Electrostatics and Magnetostatics' },
      { name: "Maxwell's Equations" },
      { name: 'Transmission Lines and Waveguides' },
    ],
  },
];
