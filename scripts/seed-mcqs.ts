/**
 * Seed MCQs — 5 questions per chapter across Physics, Chemistry, Mathematics, Biology.
 * Supports both Firebase and MongoDB via DATABASE_PROVIDER env var.
 * Run: npx tsx --env-file=.env.development scripts/seed-mcqs.ts
 *
 * Prerequisites: seed-all.ts and seed-tags.ts must have been run first.
 */

import { getAdapter, generateId, nowIso } from './seed-helpers';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
type CB = { type: 'TEXT' | 'MATH'; content: string };
type Opt = { id: string; content: CB[]; isCorrect: boolean };

function text(content: string): CB { return { type: 'TEXT', content }; }
function math(content: string): CB { return { type: 'MATH', content }; }
function opt(id: string, content: CB[], isCorrect = false): Opt { return { id, content, isCorrect }; }

interface RawMCQ {
  chapterKey: string;       // matches key in CHAPTER_MCQS
  difficulty: Difficulty;
  tagNames: string[];
  question: CB[];
  options: Opt[];
  explanation: CB[];
}

// ─── MCQ DATA ─────────────────────────────────────────────────────────────────
// 5 questions per chapter, 22 chapters = 110 MCQs total

const CHAPTER_MCQS: RawMCQ[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // PHYSICS
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Mechanics ──
  { chapterKey: 'Physics/Mechanics', difficulty: 'EASY', tagNames: ['Concept Based', 'Important'],
    question: [text('A body is thrown vertically upward with velocity u. The maximum height attained is:')],
    options: [
      opt('A', [math('h = \\frac{u}{2g}')]),
      opt('B', [math('h = \\frac{u^2}{2g}')], true),
      opt('C', [math('h = \\frac{u^2}{g}')]),
      opt('D', [math('h = \\frac{2u^2}{g}')]),
    ],
    explanation: [text('At maximum height, final velocity v = 0. Using '), math('v^2 = u^2 - 2gh'), text(', we get '), math('h = \\frac{u^2}{2g}'), text('.')],
  },
  { chapterKey: 'Physics/Mechanics', difficulty: 'MEDIUM', tagNames: ['Numerical', 'Formula Based'],
    question: [text('A car accelerates from rest at 4 m/s² for 5 seconds. The distance covered is:')],
    options: [
      opt('A', [text('20 m')]),
      opt('B', [text('40 m')]),
      opt('C', [text('50 m')], true),
      opt('D', [text('100 m')]),
    ],
    explanation: [text('Using '), math('s = ut + \\frac{1}{2}at^2'), text(' with u=0, a=4, t=5: '), math('s = 0 + \\frac{1}{2}(4)(25) = 50 \\text{ m}')],
  },
  { chapterKey: 'Physics/Mechanics', difficulty: 'MEDIUM', tagNames: ['Concept Based'],
    question: [text('Newton\'s third law states that:')],
    options: [
      opt('A', [text('A body at rest remains at rest unless acted upon by a net force')]),
      opt('B', [text('For every action there is an equal and opposite reaction')], true),
      opt('C', [text('Force equals mass times acceleration')]),
      opt('D', [text('The rate of change of momentum equals applied force')]),
    ],
    explanation: [text('Newton\'s third law: every action has an equal and opposite reaction. The action-reaction pair acts on different bodies.')],
  },
  { chapterKey: 'Physics/Mechanics', difficulty: 'HARD', tagNames: ['Numerical', 'High Weightage'],
    question: [text('A 2 kg block is pushed up a 30° incline with μ = 0.3. The minimum force required (parallel to incline) is: (g = 10 m/s²)')],
    options: [
      opt('A', [text('10 N')]),
      opt('B', [text('12.2 N')], true),
      opt('C', [text('15.2 N')]),
      opt('D', [text('17.3 N')]),
    ],
    explanation: [text('F = mg sin30° + μmg cos30° = 2×10×0.5 + 0.3×2×10×0.866 = 10 + 5.196 ≈ 12.2 N')],
  },
  { chapterKey: 'Physics/Mechanics', difficulty: 'MEDIUM', tagNames: ['Formula Based', 'Important'],
    question: [text('The work-energy theorem states that the net work done on a body equals:')],
    options: [
      opt('A', [text('The change in potential energy')]),
      opt('B', [text('The change in kinetic energy')], true),
      opt('C', [text('The total mechanical energy')]),
      opt('D', [text('The change in momentum')]),
    ],
    explanation: [text('The work-energy theorem: '), math('W_{net} = \\Delta KE = \\frac{1}{2}mv_f^2 - \\frac{1}{2}mv_i^2')],
  },

  // ── Waves & Oscillations ──
  { chapterKey: 'Physics/Waves & Oscillations', difficulty: 'EASY', tagNames: ['Concept Based'],
    question: [text('The time period of a simple pendulum depends on:')],
    options: [
      opt('A', [text('Mass of the bob')]),
      opt('B', [text('Amplitude of oscillation')]),
      opt('C', [text('Length of the pendulum')], true),
      opt('D', [text('Material of the bob')]),
    ],
    explanation: [text('Time period '), math('T = 2\\pi\\sqrt{\\frac{L}{g}}'), text('. It depends only on length L and acceleration due to gravity g, not on mass or amplitude (for small angles).')],
  },
  { chapterKey: 'Physics/Waves & Oscillations', difficulty: 'MEDIUM', tagNames: ['Formula Based', 'Numerical'],
    question: [text('A wave has frequency 200 Hz and wavelength 1.5 m. Its speed is:')],
    options: [
      opt('A', [text('133 m/s')]),
      opt('B', [text('200 m/s')]),
      opt('C', [text('300 m/s')], true),
      opt('D', [text('400 m/s')]),
    ],
    explanation: [text('Wave speed v = fλ = 200 × 1.5 = 300 m/s')],
  },
  { chapterKey: 'Physics/Waves & Oscillations', difficulty: 'HARD', tagNames: ['High Weightage', 'Numerical'],
    question: [text('Two sound sources of frequencies 256 Hz and 260 Hz are sounded together. The number of beats heard per second is:')],
    options: [
      opt('A', [text('2')]),
      opt('B', [text('4')], true),
      opt('C', [text('516')]),
      opt('D', [text('258')]),
    ],
    explanation: [text('Number of beats = |f₁ - f₂| = |256 - 260| = 4 beats per second')],
  },
  { chapterKey: 'Physics/Waves & Oscillations', difficulty: 'EASY', tagNames: ['Concept Based', 'Theory'],
    question: [text('In simple harmonic motion, the restoring force is proportional to:')],
    options: [
      opt('A', [text('Velocity')]),
      opt('B', [text('Acceleration')]),
      opt('C', [text('Displacement')], true),
      opt('D', [text('Square of displacement')]),
    ],
    explanation: [text('In SHM, restoring force F = -kx, where x is displacement from mean position. The negative sign indicates the force opposes displacement.')],
  },
  { chapterKey: 'Physics/Waves & Oscillations', difficulty: 'MEDIUM', tagNames: ['Application'],
    question: [text('The Doppler effect is observed when:')],
    options: [
      opt('A', [text('Source only is moving')]),
      opt('B', [text('Observer only is moving')]),
      opt('C', [text('Both source and observer are at rest')]),
      opt('D', [text('There is relative motion between source and observer')], true),
    ],
    explanation: [text('Doppler effect occurs whenever there is relative motion between the source of sound and the observer, regardless of which one is moving.')],
  },

  // ── Thermodynamics ──
  { chapterKey: 'Physics/Thermodynamics', difficulty: 'EASY', tagNames: ['Theory', 'Concept Based'],
    question: [text('The zeroth law of thermodynamics defines which physical quantity?')],
    options: [
      opt('A', [text('Internal energy')]),
      opt('B', [text('Entropy')]),
      opt('C', [text('Temperature')], true),
      opt('D', [text('Heat')]),
    ],
    explanation: [text('The zeroth law establishes that temperature is a well-defined property — if A is in thermal equilibrium with B, and B with C, then A is in equilibrium with C.')],
  },
  { chapterKey: 'Physics/Thermodynamics', difficulty: 'MEDIUM', tagNames: ['Formula Based', 'High Weightage'],
    question: [text('For an ideal gas undergoing isothermal expansion, which relation holds?')],
    options: [
      opt('A', [math('PV^\\gamma = \\text{const}')]),
      opt('B', [math('PV = \\text{const}')], true),
      opt('C', [math('P/T = \\text{const}')]),
      opt('D', [math('V/T = \\text{const}')]),
    ],
    explanation: [text('Isothermal means constant temperature. By Boyle\'s law: PV = nRT = constant, so PV = const.')],
  },
  { chapterKey: 'Physics/Thermodynamics', difficulty: 'HARD', tagNames: ['Numerical', 'High Weightage'],
    question: [text('A Carnot engine operates between 600 K and 300 K. Its efficiency is:')],
    options: [
      opt('A', [text('25%')]),
      opt('B', [text('33%')]),
      opt('C', [text('50%')], true),
      opt('D', [text('75%')]),
    ],
    explanation: [text('Carnot efficiency η = 1 - T_cold/T_hot = 1 - 300/600 = 0.5 = 50%')],
  },
  { chapterKey: 'Physics/Thermodynamics', difficulty: 'MEDIUM', tagNames: ['Concept Based'],
    question: [text('The first law of thermodynamics is essentially a statement of:')],
    options: [
      opt('A', [text('Conservation of momentum')]),
      opt('B', [text('Conservation of energy')], true),
      opt('C', [text('Increase in entropy')]),
      opt('D', [text('Conservation of mass')]),
    ],
    explanation: [text('The first law ΔU = Q - W is a statement of conservation of energy — energy can be converted but not created or destroyed.')],
  },
  { chapterKey: 'Physics/Thermodynamics', difficulty: 'EASY', tagNames: ['Theory'],
    question: [text('Which process in a gas occurs at constant pressure?')],
    options: [
      opt('A', [text('Isothermal')]),
      opt('B', [text('Adiabatic')]),
      opt('C', [text('Isochoric')]),
      opt('D', [text('Isobaric')], true),
    ],
    explanation: [text('Isobaric process occurs at constant pressure. Isothermal = constant temperature, Adiabatic = no heat exchange, Isochoric = constant volume.')],
  },

  // ── Electrostatics ──
  { chapterKey: 'Physics/Electrostatics', difficulty: 'EASY', tagNames: ['Formula Based'],
    question: [text("Coulomb's law gives the force between two point charges q₁ and q₂ separated by distance r as:")],
    options: [
      opt('A', [math('F = \\frac{q_1 q_2}{4\\pi\\varepsilon_0 r}')]),
      opt('B', [math('F = \\frac{q_1 q_2}{4\\pi\\varepsilon_0 r^2}')], true),
      opt('C', [math('F = \\frac{q_1 + q_2}{4\\pi\\varepsilon_0 r^2}')]),
      opt('D', [math('F = 4\\pi\\varepsilon_0 \\frac{r^2}{q_1 q_2}')]),
    ],
    explanation: [text("Coulomb's law: F = kq₁q₂/r², where k = 1/(4πε₀) = 9×10⁹ N·m²/C²")],
  },
  { chapterKey: 'Physics/Electrostatics', difficulty: 'MEDIUM', tagNames: ['Concept Based', 'Important'],
    question: [text('The electric field inside a hollow conducting sphere (with no internal charge) is:')],
    options: [
      opt('A', [text('Maximum at the centre')]),
      opt('B', [text('Uniform throughout')]),
      opt('C', [text('Zero everywhere inside')], true),
      opt('D', [text('Equal to field just outside')]),
    ],
    explanation: [text('By Gauss\'s law, the electric field inside a hollow conductor is zero. All charges reside on the outer surface.')],
  },
  { chapterKey: 'Physics/Electrostatics', difficulty: 'HARD', tagNames: ['Numerical', 'High Weightage'],
    question: [text('Two capacitors of 4 μF and 6 μF are connected in series. The equivalent capacitance is:')],
    options: [
      opt('A', [text('10 μF')]),
      opt('B', [text('2.4 μF')], true),
      opt('C', [text('5 μF')]),
      opt('D', [text('1.2 μF')]),
    ],
    explanation: [text('For series: 1/C = 1/C₁ + 1/C₂ = 1/4 + 1/6 = 5/12, so C = 12/5 = 2.4 μF')],
  },
  { chapterKey: 'Physics/Electrostatics', difficulty: 'MEDIUM', tagNames: ['Formula Based'],
    question: [text('The potential energy stored in a capacitor of capacitance C charged to voltage V is:')],
    options: [
      opt('A', [math('U = CV')]),
      opt('B', [math('U = CV^2')]),
      opt('C', [math('U = \\frac{1}{2}CV^2')], true),
      opt('D', [math('U = \\frac{C}{2V}')]),
    ],
    explanation: [text('Energy stored in capacitor: U = ½CV² = Q²/2C = QV/2')],
  },
  { chapterKey: 'Physics/Electrostatics', difficulty: 'EASY', tagNames: ['Theory', 'Concept Based'],
    question: [text('Electric field lines always:')],
    options: [
      opt('A', [text('Form closed loops')]),
      opt('B', [text('Start from negative charges')]),
      opt('C', [text('Start from positive and end at negative charges')], true),
      opt('D', [text('Are parallel to equipotential surfaces')]),
    ],
    explanation: [text('Electric field lines originate from positive charges and terminate at negative charges. They are perpendicular (not parallel) to equipotential surfaces.')],
  },

  // ── Current Electricity ──
  { chapterKey: 'Physics/Current Electricity', difficulty: 'EASY', tagNames: ['Formula Based'],
    question: [text("Ohm's law states that (at constant temperature):")],
    options: [
      opt('A', [text('Current is proportional to resistance')]),
      opt('B', [text('Voltage is inversely proportional to current')]),
      opt('C', [text('Current is proportional to voltage')], true),
      opt('D', [text('Resistance is proportional to voltage')]),
    ],
    explanation: [text("Ohm's law: V = IR, so I ∝ V at constant resistance and temperature.")],
  },
  { chapterKey: 'Physics/Current Electricity', difficulty: 'MEDIUM', tagNames: ['Numerical', 'Application'],
    question: [text('Three resistors of 2 Ω, 3 Ω, and 6 Ω are connected in parallel. The equivalent resistance is:')],
    options: [
      opt('A', [text('11 Ω')]),
      opt('B', [text('1 Ω')], true),
      opt('C', [text('3.67 Ω')]),
      opt('D', [text('0.5 Ω')]),
    ],
    explanation: [text('1/R = 1/2 + 1/3 + 1/6 = 3/6 + 2/6 + 1/6 = 6/6 = 1, so R = 1 Ω')],
  },
  { chapterKey: 'Physics/Current Electricity', difficulty: 'MEDIUM', tagNames: ['Concept Based', 'High Weightage'],
    question: [text("Kirchhoff's current law (KCL) is based on conservation of:")],
    options: [
      opt('A', [text('Energy')]),
      opt('B', [text('Charge')], true),
      opt('C', [text('Momentum')]),
      opt('D', [text('Mass')]),
    ],
    explanation: [text("KCL states that the sum of currents entering a node equals sum leaving — this is conservation of electric charge (no accumulation at a node).")],
  },
  { chapterKey: 'Physics/Current Electricity', difficulty: 'HARD', tagNames: ['Numerical'],
    question: [text('A battery of EMF 12V and internal resistance 2Ω is connected to an external resistance of 4Ω. The terminal voltage is:')],
    options: [
      opt('A', [text('12 V')]),
      opt('B', [text('10 V')]),
      opt('C', [text('8 V')], true),
      opt('D', [text('6 V')]),
    ],
    explanation: [text('Current I = E/(R+r) = 12/6 = 2A. Terminal voltage = E - Ir = 12 - 2×2 = 8 V')],
  },
  { chapterKey: 'Physics/Current Electricity', difficulty: 'EASY', tagNames: ['Theory'],
    question: [text('The SI unit of electric resistance is:')],
    options: [
      opt('A', [text('Ampere')]),
      opt('B', [text('Volt')]),
      opt('C', [text('Ohm')], true),
      opt('D', [text('Siemens')]),
    ],
    explanation: [text('The SI unit of resistance is the Ohm (Ω). Siemens is the unit of conductance (reciprocal of resistance).')],
  },

  // ── Magnetism ──
  { chapterKey: 'Physics/Magnetism', difficulty: 'EASY', tagNames: ['Theory', 'Concept Based'],
    question: [text('The force on a moving charge in a magnetic field is given by:')],
    options: [
      opt('A', [math('F = qE')]),
      opt('B', [math('F = qvB\\sin\\theta')], true),
      opt('C', [math('F = qvB\\cos\\theta')]),
      opt('D', [math('F = \\frac{qB}{v}')]),
    ],
    explanation: [text('The Lorentz magnetic force: F = q(v × B), with magnitude F = qvB sinθ where θ is the angle between v and B.')],
  },
  { chapterKey: 'Physics/Magnetism', difficulty: 'MEDIUM', tagNames: ['High Weightage', 'Concept Based'],
    question: [text("Faraday's law of electromagnetic induction states that the induced EMF is proportional to:")],
    options: [
      opt('A', [text('The magnetic flux')]),
      opt('B', [text('The rate of change of magnetic flux')], true),
      opt('C', [text('The square of magnetic flux')]),
      opt('D', [text('The velocity of the conductor')]),
    ],
    explanation: [text("Faraday's law: EMF = -dΦ/dt. The induced EMF equals the negative rate of change of magnetic flux through the circuit.")],
  },
  { chapterKey: 'Physics/Magnetism', difficulty: 'HARD', tagNames: ['Numerical', 'Formula Based'],
    question: [text('A solenoid has 1000 turns, length 0.5 m, area 4 cm². Its self-inductance is: (μ₀ = 4π × 10⁻⁷ T·m/A)')],
    options: [
      opt('A', [text('0.1 mH')]),
      opt('B', [text('1 mH')], true),
      opt('C', [text('4 mH')]),
      opt('D', [text('10 mH')]),
    ],
    explanation: [text('L = μ₀n²V = μ₀(N/l)²(Al) = 4π×10⁻⁷ × (1000/0.5)² × 4×10⁻⁴ × 0.5 ≈ 1 mH')],
  },
  { chapterKey: 'Physics/Magnetism', difficulty: 'EASY', tagNames: ['Theory'],
    question: [text('Lenz\'s law is a consequence of conservation of:')],
    options: [
      opt('A', [text('Charge')]),
      opt('B', [text('Momentum')]),
      opt('C', [text('Energy')], true),
      opt('D', [text('Mass')]),
    ],
    explanation: [text('Lenz\'s law — induced current opposes the change causing it — is a manifestation of conservation of energy.')],
  },
  { chapterKey: 'Physics/Magnetism', difficulty: 'MEDIUM', tagNames: ['Application'],
    question: [text('A transformer steps up voltage from 220 V to 22000 V. If primary has 100 turns, secondary turns are:')],
    options: [
      opt('A', [text('1000')]),
      opt('B', [text('10000')], true),
      opt('C', [text('100')]),
      opt('D', [text('22000')]),
    ],
    explanation: [text('Vs/Vp = Ns/Np → Ns = Np × Vs/Vp = 100 × 22000/220 = 10000 turns')],
  },

  // ── Optics ──
  { chapterKey: 'Physics/Optics', difficulty: 'EASY', tagNames: ['Formula Based'],
    question: [text("The mirror formula is:")],
    options: [
      opt('A', [math('\\frac{1}{f} = \\frac{1}{u} - \\frac{1}{v}')]),
      opt('B', [math('\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}')], true),
      opt('C', [math('f = u + v')]),
      opt('D', [math('\\frac{1}{f} = \\frac{u}{v}')]),
    ],
    explanation: [text('Mirror formula: 1/f = 1/v + 1/u, where f is focal length, v is image distance, and u is object distance (with sign convention).')],
  },
  { chapterKey: 'Physics/Optics', difficulty: 'MEDIUM', tagNames: ['Concept Based', 'High Weightage'],
    question: [text('Total internal reflection occurs when:')],
    options: [
      opt('A', [text('Light travels from rarer to denser medium at any angle')]),
      opt('B', [text('Light travels from denser to rarer medium beyond critical angle')], true),
      opt('C', [text('Light is incident normally on a surface')]),
      opt('D', [text('Angle of incidence equals angle of refraction')]),
    ],
    explanation: [text('TIR occurs when light travels from optically denser to rarer medium and the angle of incidence exceeds the critical angle.')],
  },
  { chapterKey: 'Physics/Optics', difficulty: 'HARD', tagNames: ['Numerical'],
    question: [text('Young\'s double slit experiment uses light of λ = 600 nm, slit separation d = 0.2 mm, screen at D = 1 m. Fringe width is:')],
    options: [
      opt('A', [text('1 mm')]),
      opt('B', [text('2 mm')]),
      opt('C', [text('3 mm')], true),
      opt('D', [text('6 mm')]),
    ],
    explanation: [text('Fringe width β = λD/d = 600×10⁻⁹ × 1 / (0.2×10⁻³) = 3×10⁻³ m = 3 mm')],
  },
  { chapterKey: 'Physics/Optics', difficulty: 'MEDIUM', tagNames: ['Application', 'Concept Based'],
    question: [text('Which phenomenon explains the blue colour of the sky?')],
    options: [
      opt('A', [text('Reflection')]),
      opt('B', [text('Refraction')]),
      opt('C', [text('Rayleigh scattering')], true),
      opt('D', [text('Diffraction')]),
    ],
    explanation: [text('Rayleigh scattering: shorter wavelengths (blue) are scattered more than longer wavelengths (red). Scattering intensity ∝ 1/λ⁴.')],
  },
  { chapterKey: 'Physics/Optics', difficulty: 'EASY', tagNames: ['Theory'],
    question: [text('Diffraction of light is most pronounced when the slit width is:')],
    options: [
      opt('A', [text('Much larger than wavelength')]),
      opt('B', [text('Much smaller than wavelength')]),
      opt('C', [text('Comparable to wavelength')], true),
      opt('D', [text('Infinity')]),
    ],
    explanation: [text('Diffraction is most pronounced when the obstacle or opening size is comparable to the wavelength of light.')],
  },

  // ── Modern Physics ──
  { chapterKey: 'Physics/Modern Physics', difficulty: 'MEDIUM', tagNames: ['Formula Based', 'High Weightage'],
    question: [text('The de Broglie wavelength of a particle of mass m moving with velocity v is:')],
    options: [
      opt('A', [math('\\lambda = mvh')]),
      opt('B', [math('\\lambda = \\frac{mv}{h}')]),
      opt('C', [math('\\lambda = \\frac{h}{mv}')], true),
      opt('D', [math('\\lambda = \\frac{h}{m^2v}')]),
    ],
    explanation: [text('de Broglie relation: λ = h/p = h/(mv), where h is Planck\'s constant.')],
  },
  { chapterKey: 'Physics/Modern Physics', difficulty: 'EASY', tagNames: ['Theory', 'Concept Based'],
    question: [text('The photoelectric effect demonstrates the:')],
    options: [
      opt('A', [text('Wave nature of light')]),
      opt('B', [text('Particle (quantum) nature of light')], true),
      opt('C', [text('Dual nature of electrons')]),
      opt('D', [text('Wave nature of electrons')]),
    ],
    explanation: [text('The photoelectric effect showed light behaves as discrete packets (photons). Einstein\'s explanation earned him the Nobel Prize in 1921.')],
  },
  { chapterKey: 'Physics/Modern Physics', difficulty: 'HARD', tagNames: ['Numerical'],
    question: [text('The half-life of a radioactive substance is 10 years. The fraction remaining after 30 years is:')],
    options: [
      opt('A', [text('1/4')]),
      opt('B', [text('1/8')], true),
      opt('C', [text('1/16')]),
      opt('D', [text('1/3')]),
    ],
    explanation: [text('After n half-lives, fraction remaining = (1/2)ⁿ. n = 30/10 = 3, so fraction = (1/2)³ = 1/8')],
  },
  { chapterKey: 'Physics/Modern Physics', difficulty: 'MEDIUM', tagNames: ['Concept Based'],
    question: [text('In Bohr\'s model, the angular momentum of an electron in nth orbit is:')],
    options: [
      opt('A', [math('L = nh')]),
      opt('B', [math('L = \\frac{nh}{2\\pi}')], true),
      opt('C', [math('L = \\frac{h}{2\\pi n}')]),
      opt('D', [math('L = n^2 h')]),
    ],
    explanation: [text('Bohr\'s quantization condition: L = nh/2π = nℏ, where n is the principal quantum number.')],
  },
  { chapterKey: 'Physics/Modern Physics', difficulty: 'MEDIUM', tagNames: ['Application', 'Important'],
    question: [text('Nuclear fission is used in:')],
    options: [
      opt('A', [text('Hydrogen bomb')]),
      opt('B', [text('Nuclear reactor')], true),
      opt('C', [text('Solar energy generation')]),
      opt('D', [text('X-ray production')]),
    ],
    explanation: [text('Nuclear reactors use controlled nuclear fission (splitting of heavy nuclei like U-235). Hydrogen bombs use fusion. Solar energy also uses fusion.')],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHEMISTRY
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Physical Chemistry ──
  { chapterKey: 'Chemistry/Physical Chemistry', difficulty: 'EASY', tagNames: ['Theory', 'Concept Based'],
    question: [text('The atomic number of an element equals the number of:')],
    options: [
      opt('A', [text('Neutrons in the nucleus')]),
      opt('B', [text('Protons in the nucleus')], true),
      opt('C', [text('Electrons in the outermost shell')]),
      opt('D', [text('Nucleons in the nucleus')]),
    ],
    explanation: [text('Atomic number Z = number of protons = number of electrons (in neutral atom). Mass number = protons + neutrons.')],
  },
  { chapterKey: 'Chemistry/Physical Chemistry', difficulty: 'MEDIUM', tagNames: ['Formula Based', 'High Weightage'],
    question: [text('For the reaction N₂ + 3H₂ ⇌ 2NH₃, the equilibrium constant Kp is related to Kc by:')],
    options: [
      opt('A', [math('K_p = K_c(RT)^2')]),
      opt('B', [math('K_p = K_c(RT)^{-2}')], true),
      opt('C', [math('K_p = K_c(RT)^3')]),
      opt('D', [math('K_p = K_c')]),
    ],
    explanation: [text('Kp = Kc(RT)^Δn where Δn = moles of gaseous products - moles of gaseous reactants = 2 - (1+3) = -2')],
  },
  { chapterKey: 'Chemistry/Physical Chemistry', difficulty: 'HARD', tagNames: ['Numerical', 'Important'],
    question: [text('The standard electrode potential of Zn²⁺/Zn is -0.76 V and Cu²⁺/Cu is +0.34 V. The EMF of the Daniell cell is:')],
    options: [
      opt('A', [text('0.42 V')]),
      opt('B', [text('1.10 V')], true),
      opt('C', [text('0.76 V')]),
      opt('D', [text('1.52 V')]),
    ],
    explanation: [text('EMF = E°cathode - E°anode = E°(Cu²⁺/Cu) - E°(Zn²⁺/Zn) = 0.34 - (-0.76) = 1.10 V')],
  },
  { chapterKey: 'Chemistry/Physical Chemistry', difficulty: 'MEDIUM', tagNames: ['Concept Based'],
    question: [text('Which quantum number determines the shape of an orbital?')],
    options: [
      opt('A', [text('Principal quantum number (n)')]),
      opt('B', [text('Azimuthal quantum number (l)')], true),
      opt('C', [text('Magnetic quantum number (m)')]),
      opt('D', [text('Spin quantum number (s)')]),
    ],
    explanation: [text('The azimuthal (angular momentum) quantum number l determines the shape: l=0 (s, spherical), l=1 (p, dumbbell), l=2 (d), l=3 (f).')],
  },
  { chapterKey: 'Chemistry/Physical Chemistry', difficulty: 'EASY', tagNames: ['Theory'],
    question: [text('Le Chatelier\'s principle states that when a system at equilibrium is disturbed, it will:')],
    options: [
      opt('A', [text('Shift in a direction that increases the disturbance')]),
      opt('B', [text('Shift in a direction to counteract the disturbance')], true),
      opt('C', [text('Remain at equilibrium regardless of disturbance')]),
      opt('D', [text('Always shift to produce more products')]),
    ],
    explanation: [text("Le Chatelier's principle: a system at equilibrium responds to a stress by shifting the equilibrium in a direction that reduces that stress.")],
  },

  // ── Organic Chemistry ──
  { chapterKey: 'Chemistry/Organic Chemistry', difficulty: 'EASY', tagNames: ['Theory', 'Memory Based'],
    question: [text('The IUPAC name of CH₃-CH₂-OH is:')],
    options: [
      opt('A', [text('Methanol')]),
      opt('B', [text('Ethanol')], true),
      opt('C', [text('Propanol')]),
      opt('D', [text('Ethanoic acid')]),
    ],
    explanation: [text('CH₃-CH₂-OH has 2 carbons with a hydroxyl group (-OH). IUPAC: ethanol (eth = 2 carbons, -ol = alcohol).')],
  },
  { chapterKey: 'Chemistry/Organic Chemistry', difficulty: 'MEDIUM', tagNames: ['Concept Based', 'High Weightage'],
    question: [text('Markovnikov\'s rule applies to:')],
    options: [
      opt('A', [text('Substitution reactions')]),
      opt('B', [text('Elimination reactions')]),
      opt('C', [text('Addition of HX to unsymmetrical alkenes')], true),
      opt('D', [text('Addition of H₂ to alkynes')]),
    ],
    explanation: [text("Markovnikov's rule: in addition of HX to unsymmetrical alkenes, H adds to the carbon bearing more hydrogens (the hydrogen-rich carbon).")],
  },
  { chapterKey: 'Chemistry/Organic Chemistry', difficulty: 'HARD', tagNames: ['Application', 'Important'],
    question: [text('Which reagent converts a primary alcohol to an aldehyde without over-oxidation?')],
    options: [
      opt('A', [text('KMnO₄/H₂SO₄')]),
      opt('B', [text('K₂Cr₂O₇/H₂SO₄')]),
      opt('C', [text('PCC (Pyridinium chlorochromate)')], true),
      opt('D', [text('Acidified Na₂Cr₂O₇')]),
    ],
    explanation: [text('PCC (pyridinium chlorochromate) oxidises primary alcohols to aldehydes without further oxidation to carboxylic acids, unlike acidic KMnO₄ or K₂Cr₂O₇.')],
  },
  { chapterKey: 'Chemistry/Organic Chemistry', difficulty: 'MEDIUM', tagNames: ['Theory'],
    question: [text('Which of the following is an example of a nucleophilic substitution reaction?')],
    options: [
      opt('A', [text('Combustion of methane')]),
      opt('B', [text('Halogenation of benzene')]),
      opt('C', [text('Reaction of haloalkane with NaOH (aqueous)')], true),
      opt('D', [text('Dehydration of alcohol')]),
    ],
    explanation: [text('R-X + NaOH(aq) → R-OH + NaX is an SN reaction. OH⁻ is the nucleophile attacking the electrophilic carbon bearing the leaving group X.')],
  },
  { chapterKey: 'Chemistry/Organic Chemistry', difficulty: 'EASY', tagNames: ['Memory Based'],
    question: [text('The general formula for alkenes is:')],
    options: [
      opt('A', [math('C_nH_{2n+2}')]),
      opt('B', [math('C_nH_{2n}')], true),
      opt('C', [math('C_nH_{2n-2}')]),
      opt('D', [math('C_nH_n')]),
    ],
    explanation: [text('Alkanes: CₙH₂ₙ₊₂ (saturated). Alkenes: CₙH₂ₙ (one double bond). Alkynes: CₙH₂ₙ₋₂ (one triple bond).')],
  },

  // ── Inorganic Chemistry ──
  { chapterKey: 'Chemistry/Inorganic Chemistry', difficulty: 'EASY', tagNames: ['Theory', 'Memory Based'],
    question: [text('Elements in the same group of the periodic table have the same:')],
    options: [
      opt('A', [text('Atomic mass')]),
      opt('B', [text('Number of shells')]),
      opt('C', [text('Number of valence electrons')], true),
      opt('D', [text('Atomic radius')]),
    ],
    explanation: [text('Elements in the same group have the same number of valence electrons, giving them similar chemical properties.')],
  },
  { chapterKey: 'Chemistry/Inorganic Chemistry', difficulty: 'MEDIUM', tagNames: ['Concept Based', 'High Weightage'],
    question: [text('Which of the following is not a property of transition metals?')],
    options: [
      opt('A', [text('Variable oxidation states')]),
      opt('B', [text('Formation of coloured compounds')]),
      opt('C', [text('Catalytic activity')]),
      opt('D', [text('Low melting points')], true),
    ],
    explanation: [text('Transition metals generally have HIGH melting points due to strong metallic bonding. They show variable oxidation states, coloured compounds, and catalytic activity.')],
  },
  { chapterKey: 'Chemistry/Inorganic Chemistry', difficulty: 'HARD', tagNames: ['Application'],
    question: [text('The coordination number and geometry of [Ni(CN)₄]²⁻ are:')],
    options: [
      opt('A', [text('4, Tetrahedral')]),
      opt('B', [text('4, Square planar')], true),
      opt('C', [text('6, Octahedral')]),
      opt('D', [text('6, Trigonal bipyramidal')]),
    ],
    explanation: [text('[Ni(CN)₄]²⁻: Ni is d⁸, CN⁻ is strong field ligand causing pairing → dsp² hybridisation → square planar geometry. CN = 4.')],
  },
  { chapterKey: 'Chemistry/Inorganic Chemistry', difficulty: 'MEDIUM', tagNames: ['Memory Based', 'Important'],
    question: [text('Which gas is produced when dilute H₂SO₄ reacts with zinc?')],
    options: [
      opt('A', [text('SO₂')]),
      opt('B', [text('H₂S')]),
      opt('C', [text('H₂')], true),
      opt('D', [text('O₂')]),
    ],
    explanation: [text('Zn + H₂SO₄(dil) → ZnSO₄ + H₂↑. Dilute acids react with active metals to produce hydrogen gas.')],
  },
  { chapterKey: 'Chemistry/Inorganic Chemistry', difficulty: 'EASY', tagNames: ['Theory'],
    question: [text('Ozone is an allotrope of:')],
    options: [
      opt('A', [text('Nitrogen')]),
      opt('B', [text('Hydrogen')]),
      opt('C', [text('Oxygen')], true),
      opt('D', [text('Sulfur')]),
    ],
    explanation: [text('Ozone (O₃) is an allotrope of oxygen (O₂). Both are pure forms of oxygen but differ in structure and properties.')],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Algebra ──
  { chapterKey: 'Mathematics/Algebra', difficulty: 'EASY', tagNames: ['Formula Based'],
    question: [text('The sum of the first n natural numbers is:')],
    options: [
      opt('A', [math('\\frac{n(n+1)}{4}')]),
      opt('B', [math('\\frac{n(n+1)}{2}')], true),
      opt('C', [math('n^2')]),
      opt('D', [math('\\frac{n(n-1)}{2}')]),
    ],
    explanation: [text('Sum of first n natural numbers: S = n(n+1)/2. E.g., for n=4: 1+2+3+4 = 10 = 4×5/2 = 10.')],
  },
  { chapterKey: 'Mathematics/Algebra', difficulty: 'MEDIUM', tagNames: ['Numerical', 'High Weightage'],
    question: [text('How many ways can 5 people be arranged in a row?')],
    options: [
      opt('A', [text('25')]),
      opt('B', [text('60')]),
      opt('C', [text('120')], true),
      opt('D', [text('720')]),
    ],
    explanation: [text('Number of arrangements of n distinct objects = n! = 5! = 5×4×3×2×1 = 120')],
  },
  { chapterKey: 'Mathematics/Algebra', difficulty: 'MEDIUM', tagNames: ['Formula Based'],
    question: [text('The coefficient of x³ in the expansion of (1+x)⁵ is:')],
    options: [
      opt('A', [text('5')]),
      opt('B', [text('10')], true),
      opt('C', [text('15')]),
      opt('D', [text('20')]),
    ],
    explanation: [text('By binomial theorem, coefficient of xʳ in (1+x)ⁿ is C(n,r). For r=3, n=5: C(5,3) = 10.')],
  },
  { chapterKey: 'Mathematics/Algebra', difficulty: 'HARD', tagNames: ['Numerical'],
    question: [text('The roots of the quadratic equation 2x² - 5x + 3 = 0 are:')],
    options: [
      opt('A', [math('x = 1, \\frac{3}{2}')], true),
      opt('B', [math('x = -1, -\\frac{3}{2}')]),
      opt('C', [math('x = 2, \\frac{1}{2}')]),
      opt('D', [math('x = 3, \\frac{1}{2}')]),
    ],
    explanation: [text('Using quadratic formula or factoring: 2x² - 5x + 3 = (2x-3)(x-1) = 0, so x = 3/2 or x = 1.')],
  },
  { chapterKey: 'Mathematics/Algebra', difficulty: 'EASY', tagNames: ['Theory'],
    question: [text('If A and B are two matrices, then (AB)ᵀ equals:')],
    options: [
      opt('A', [math('A^T B^T')]),
      opt('B', [math('B^T A^T')], true),
      opt('C', [math('AB')]),
      opt('D', [math('A^T + B^T')]),
    ],
    explanation: [text('The transpose of a product reverses the order: (AB)ᵀ = BᵀAᵀ. This is the reversal rule for transposes.')],
  },

  // ── Calculus ──
  { chapterKey: 'Mathematics/Calculus', difficulty: 'EASY', tagNames: ['Formula Based'],
    question: [text('The derivative of sin x with respect to x is:')],
    options: [
      opt('A', [math('-\\cos x')]),
      opt('B', [math('\\cos x')], true),
      opt('C', [math('-\\sin x')]),
      opt('D', [math('\\tan x')]),
    ],
    explanation: [text('d/dx(sin x) = cos x. This is a fundamental derivative that should be memorised.')],
  },
  { chapterKey: 'Mathematics/Calculus', difficulty: 'MEDIUM', tagNames: ['Numerical', 'Application'],
    question: [text('The integral of 2x with respect to x is:')],
    options: [
      opt('A', [math('2x^2 + C')]),
      opt('B', [math('x^2 + C')], true),
      opt('C', [math('x + C')]),
      opt('D', [math('\\frac{x^2}{2} + C')]),
    ],
    explanation: [text('∫2x dx = 2·(x²/2) + C = x² + C. Using ∫xⁿ dx = xⁿ⁺¹/(n+1) + C.')],
  },
  { chapterKey: 'Mathematics/Calculus', difficulty: 'HARD', tagNames: ['Numerical', 'High Weightage'],
    question: [text('The area enclosed between y = x² and y = x is:')],
    options: [
      opt('A', [math('\\frac{1}{6}')], true),
      opt('B', [math('\\frac{1}{3}')]),
      opt('C', [math('\\frac{1}{2}')]),
      opt('D', [math('\\frac{1}{4}')]),
    ],
    explanation: [text('Curves intersect at x=0 and x=1. Area = ∫₀¹(x - x²)dx = [x²/2 - x³/3]₀¹ = 1/2 - 1/3 = 1/6')],
  },
  { chapterKey: 'Mathematics/Calculus', difficulty: 'MEDIUM', tagNames: ['Concept Based'],
    question: [text('A function f(x) is continuous at x = a if:')],
    options: [
      opt('A', [text('f(a) is defined')]),
      opt('B', [text('lim(x→a) f(x) exists')]),
      opt('C', [text('lim(x→a) f(x) = f(a)')], true),
      opt('D', [text('f\'(a) exists')]),
    ],
    explanation: [text('Continuity at x=a requires three conditions: (1) f(a) is defined, (2) the limit exists, and (3) lim(x→a) f(x) = f(a).')],
  },
  { chapterKey: 'Mathematics/Calculus', difficulty: 'EASY', tagNames: ['Theory'],
    question: [text('The differential equation dy/dx = y represents:')],
    options: [
      opt('A', [text('Linear decay')]),
      opt('B', [text('Exponential growth')], true),
      opt('C', [text('Circular motion')]),
      opt('D', [text('Oscillation')]),
    ],
    explanation: [text('dy/dx = y separates to dy/y = dx → ln|y| = x + C → y = Aeˣ, which is exponential growth.')],
  },

  // ── Coordinate Geometry ──
  { chapterKey: 'Mathematics/Coordinate Geometry', difficulty: 'EASY', tagNames: ['Formula Based'],
    question: [text('The distance between points (3, 4) and (0, 0) is:')],
    options: [
      opt('A', [text('3')]),
      opt('B', [text('4')]),
      opt('C', [text('5')], true),
      opt('D', [text('7')]),
    ],
    explanation: [text('Distance = √((x₂-x₁)² + (y₂-y₁)²) = √(9+16) = √25 = 5. This is a 3-4-5 Pythagorean triple.')],
  },
  { chapterKey: 'Mathematics/Coordinate Geometry', difficulty: 'MEDIUM', tagNames: ['Concept Based'],
    question: [text('The equation x² + y² + 2gx + 2fy + c = 0 represents a circle. Its centre is:')],
    options: [
      opt('A', [math('(g, f)')]),
      opt('B', [math('(-g, -f)')], true),
      opt('C', [math('(2g, 2f)')]),
      opt('D', [math('(-2g, -2f)')]),
    ],
    explanation: [text('Comparing with (x-h)²+(y-k)²=r²: x²+2gx+y²+2fy = -c → centre is (-g, -f), radius = √(g²+f²-c).')],
  },
  { chapterKey: 'Mathematics/Coordinate Geometry', difficulty: 'HARD', tagNames: ['Numerical'],
    question: [text('The eccentricity of the ellipse x²/25 + y²/9 = 1 is:')],
    options: [
      opt('A', [math('\\frac{3}{5}')]),
      opt('B', [math('\\frac{4}{5}')], true),
      opt('C', [math('\\frac{2}{5}')]),
      opt('D', [math('\\frac{5}{4}')]),
    ],
    explanation: [text('a²=25, b²=9. c²=a²-b²=16, c=4. Eccentricity e=c/a=4/5.')],
  },
  { chapterKey: 'Mathematics/Coordinate Geometry', difficulty: 'MEDIUM', tagNames: ['Formula Based'],
    question: [text('The slope of the line joining (2, 3) and (5, 9) is:')],
    options: [
      opt('A', [text('1')]),
      opt('B', [text('2')], true),
      opt('C', [text('3')]),
      opt('D', [text('0.5')]),
    ],
    explanation: [text('Slope m = (y₂-y₁)/(x₂-x₁) = (9-3)/(5-2) = 6/3 = 2')],
  },
  { chapterKey: 'Mathematics/Coordinate Geometry', difficulty: 'EASY', tagNames: ['Theory'],
    question: [text('The parabola y² = 4ax opens:')],
    options: [
      opt('A', [text('Upward')]),
      opt('B', [text('Downward')]),
      opt('C', [text('To the right')], true),
      opt('D', [text('To the left')]),
    ],
    explanation: [text('y² = 4ax (a > 0): since y is squared, the parabola opens to the right, with vertex at origin and focus at (a, 0).')],
  },

  // ── Trigonometry ──
  { chapterKey: 'Mathematics/Trigonometry', difficulty: 'EASY', tagNames: ['Formula Based', 'Memory Based'],
    question: [text('The value of sin 30° is:')],
    options: [
      opt('A', [math('\\frac{\\sqrt{3}}{2}')]),
      opt('B', [math('\\frac{1}{2}')], true),
      opt('C', [math('\\frac{1}{\\sqrt{2}}')]),
      opt('D', [text('1')]),
    ],
    explanation: [text('Standard values: sin 30° = 1/2, cos 30° = √3/2, sin 45° = cos 45° = 1/√2, sin 60° = √3/2.')],
  },
  { chapterKey: 'Mathematics/Trigonometry', difficulty: 'MEDIUM', tagNames: ['Formula Based'],
    question: [text('The principal value of arcsin(1/2) in radians is:')],
    options: [
      opt('A', [math('\\frac{\\pi}{6}')], true),
      opt('B', [math('\\frac{\\pi}{4}')]),
      opt('C', [math('\\frac{\\pi}{3}')]),
      opt('D', [math('\\frac{\\pi}{2}')]),
    ],
    explanation: [text('sin⁻¹(1/2) = π/6 (30°), since sin(π/6) = 1/2. Principal range of arcsin is [-π/2, π/2].')],
  },
  { chapterKey: 'Mathematics/Trigonometry', difficulty: 'MEDIUM', tagNames: ['Concept Based'],
    question: [text('Which identity is correct?')],
    options: [
      opt('A', [math('\\sin^2\\theta - \\cos^2\\theta = 1')]),
      opt('B', [math('\\tan^2\\theta - \\sec^2\\theta = 1')]),
      opt('C', [math('\\sin^2\\theta + \\cos^2\\theta = 1')], true),
      opt('D', [math('\\cot^2\\theta - \\csc^2\\theta = 1')]),
    ],
    explanation: [text('The Pythagorean identity: sin²θ + cos²θ = 1. Others: 1 + tan²θ = sec²θ, and 1 + cot²θ = csc²θ.')],
  },
  { chapterKey: 'Mathematics/Trigonometry', difficulty: 'HARD', tagNames: ['Numerical'],
    question: [text('If sin A = 3/5 (A in first quadrant), cos A equals:')],
    options: [
      opt('A', [math('\\frac{3}{4}')]),
      opt('B', [math('\\frac{4}{5}')], true),
      opt('C', [math('\\frac{5}{3}')]),
      opt('D', [math('\\frac{3}{5}')]),
    ],
    explanation: [text('cos²A = 1 - sin²A = 1 - 9/25 = 16/25. Since A is in Q1, cos A = +4/5. (3-4-5 right triangle)')],
  },
  { chapterKey: 'Mathematics/Trigonometry', difficulty: 'EASY', tagNames: ['Formula Based'],
    question: [text('The formula for sin(A + B) is:')],
    options: [
      opt('A', [math('\\sin A + \\sin B')]),
      opt('B', [math('\\sin A \\cos B + \\cos A \\sin B')], true),
      opt('C', [math('\\sin A \\cos B - \\cos A \\sin B')]),
      opt('D', [math('\\cos A \\cos B + \\sin A \\sin B')]),
    ],
    explanation: [text('Sum formula: sin(A+B) = sinA cosB + cosA sinB. Note: cos(A+B) = cosA cosB - sinA sinB.')],
  },

  // ── Vectors & 3D ──
  { chapterKey: 'Mathematics/Vectors & 3D', difficulty: 'EASY', tagNames: ['Formula Based'],
    question: [text('The magnitude of vector a = 3î + 4ĵ is:')],
    options: [
      opt('A', [text('3')]),
      opt('B', [text('4')]),
      opt('C', [text('5')], true),
      opt('D', [text('7')]),
    ],
    explanation: [text('|a| = √(3² + 4²) = √(9+16) = √25 = 5')],
  },
  { chapterKey: 'Mathematics/Vectors & 3D', difficulty: 'MEDIUM', tagNames: ['Concept Based'],
    question: [text('The dot product of two perpendicular vectors is:')],
    options: [
      opt('A', [text('1')]),
      opt('B', [text('-1')]),
      opt('C', [text('0')], true),
      opt('D', [text('Their magnitudes product')]),
    ],
    explanation: [text('a·b = |a||b|cosθ. For perpendicular vectors θ = 90°, cos90° = 0, so a·b = 0.')],
  },
  { chapterKey: 'Mathematics/Vectors & 3D', difficulty: 'HARD', tagNames: ['Numerical'],
    question: [text('The angle between vectors a = î + ĵ and b = î is:')],
    options: [
      opt('A', [text('0°')]),
      opt('B', [text('30°')]),
      opt('C', [text('45°')], true),
      opt('D', [text('90°')]),
    ],
    explanation: [text('cosθ = (a·b)/(|a||b|) = 1/(√2 × 1) = 1/√2. Therefore θ = 45°.')],
  },
  { chapterKey: 'Mathematics/Vectors & 3D', difficulty: 'MEDIUM', tagNames: ['Formula Based'],
    question: [text('The direction cosines of a line satisfy:')],
    options: [
      opt('A', [math('l + m + n = 1')]),
      opt('B', [math('l^2 + m^2 + n^2 = 1')], true),
      opt('C', [math('l^2 + m^2 + n^2 = 0')]),
      opt('D', [math('l \\cdot m \\cdot n = 1')]),
    ],
    explanation: [text('If l, m, n are direction cosines (l=cosα, m=cosβ, n=cosγ), then l²+m²+n²=1 always holds.')],
  },
  { chapterKey: 'Mathematics/Vectors & 3D', difficulty: 'EASY', tagNames: ['Theory'],
    question: [text('The cross product a × b gives a vector that is:')],
    options: [
      opt('A', [text('Parallel to both a and b')]),
      opt('B', [text('Perpendicular to both a and b')], true),
      opt('C', [text('Along the bisector of a and b')]),
      opt('D', [text('In the plane of a and b')]),
    ],
    explanation: [text('The cross product a × b produces a vector perpendicular to both a and b, with direction given by the right-hand rule.')],
  },

  // ── Statistics & Probability ──
  { chapterKey: 'Mathematics/Statistics & Probability', difficulty: 'EASY', tagNames: ['Formula Based'],
    question: [text('The probability of an impossible event is:')],
    options: [
      opt('A', [text('1')]),
      opt('B', [text('0.5')]),
      opt('C', [text('0')], true),
      opt('D', [text('-1')]),
    ],
    explanation: [text('An impossible event never occurs, so its probability P = 0. A certain event has P = 1. All probabilities lie in [0, 1].')],
  },
  { chapterKey: 'Mathematics/Statistics & Probability', difficulty: 'MEDIUM', tagNames: ['Numerical'],
    question: [text('The mean of the data 2, 4, 6, 8, 10 is:')],
    options: [
      opt('A', [text('4')]),
      opt('B', [text('5')]),
      opt('C', [text('6')], true),
      opt('D', [text('8')]),
    ],
    explanation: [text('Mean = (2+4+6+8+10)/5 = 30/5 = 6')],
  },
  { chapterKey: 'Mathematics/Statistics & Probability', difficulty: 'HARD', tagNames: ['Numerical', 'High Weightage'],
    question: [text('A bag has 4 red and 6 blue balls. Two balls are drawn without replacement. P(both red) is:')],
    options: [
      opt('A', [math('\\frac{2}{15}')], true),
      opt('B', [math('\\frac{4}{25}')]),
      opt('C', [math('\\frac{1}{5}')]),
      opt('D', [math('\\frac{4}{15}')]),
    ],
    explanation: [text('P(both red) = C(4,2)/C(10,2) = 6/45 = 2/15')],
  },
  { chapterKey: 'Mathematics/Statistics & Probability', difficulty: 'MEDIUM', tagNames: ['Concept Based'],
    question: [text('The standard deviation is the square root of the:')],
    options: [
      opt('A', [text('Mean')]),
      opt('B', [text('Median')]),
      opt('C', [text('Variance')], true),
      opt('D', [text('Range')]),
    ],
    explanation: [text('Standard deviation σ = √Variance. It measures the spread of data around the mean.')],
  },
  { chapterKey: 'Mathematics/Statistics & Probability', difficulty: 'EASY', tagNames: ['Theory'],
    question: [text('For two mutually exclusive events A and B, P(A ∪ B) equals:')],
    options: [
      opt('A', [math('P(A) \\cdot P(B)')]),
      opt('B', [math('P(A) + P(B) - P(A \\cap B)')]),
      opt('C', [math('P(A) + P(B)')], true),
      opt('D', [math('P(A) - P(B)')]),
    ],
    explanation: [text('Mutually exclusive means P(A∩B) = 0. So P(A∪B) = P(A) + P(B) - 0 = P(A) + P(B).')],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BIOLOGY
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Cell Biology ──
  { chapterKey: 'Biology/Cell Biology', difficulty: 'EASY', tagNames: ['Theory', 'Memory Based'],
    question: [text('The powerhouse of the cell is:')],
    options: [
      opt('A', [text('Ribosome')]),
      opt('B', [text('Golgi apparatus')]),
      opt('C', [text('Mitochondria')], true),
      opt('D', [text('Endoplasmic reticulum')]),
    ],
    explanation: [text('Mitochondria produce ATP through cellular respiration (oxidative phosphorylation), hence called the powerhouse of the cell.')],
  },
  { chapterKey: 'Biology/Cell Biology', difficulty: 'MEDIUM', tagNames: ['Concept Based'],
    question: [text('During mitosis, chromosomes align at the cell equator in which phase?')],
    options: [
      opt('A', [text('Prophase')]),
      opt('B', [text('Metaphase')], true),
      opt('C', [text('Anaphase')]),
      opt('D', [text('Telophase')]),
    ],
    explanation: [text('In metaphase, chromosomes are maximally condensed and align at the metaphase plate (equatorial plane). This is the best phase to count chromosomes.')],
  },
  { chapterKey: 'Biology/Cell Biology', difficulty: 'HARD', tagNames: ['Application'],
    question: [text('In prokaryotes, the site of translation is:')],
    options: [
      opt('A', [text('Nucleus')]),
      opt('B', [text('Smooth ER')]),
      opt('C', [text('70S ribosomes')], true),
      opt('D', [text('80S ribosomes')]),
    ],
    explanation: [text('Prokaryotes have 70S ribosomes (50S + 30S subunits). Eukaryotes have 80S ribosomes. Mitochondria and chloroplasts have 70S ribosomes.')],
  },
  { chapterKey: 'Biology/Cell Biology', difficulty: 'MEDIUM', tagNames: ['Theory'],
    question: [text('Which biomolecule forms the backbone of DNA?')],
    options: [
      opt('A', [text('Phospholipids')]),
      opt('B', [text('Deoxyribose-phosphate')], true),
      opt('C', [text('Ribose-phosphate')]),
      opt('D', [text('Amino acids')]),
    ],
    explanation: [text('DNA backbone = alternating deoxyribose sugar and phosphate groups. RNA backbone uses ribose. Nitrogenous bases project inward and are not part of the backbone.')],
  },
  { chapterKey: 'Biology/Cell Biology', difficulty: 'EASY', tagNames: ['Memory Based'],
    question: [text('Which organelle is responsible for protein synthesis?')],
    options: [
      opt('A', [text('Lysosome')]),
      opt('B', [text('Ribosome')], true),
      opt('C', [text('Centrosome')]),
      opt('D', [text('Vacuole')]),
    ],
    explanation: [text('Ribosomes are the site of translation — they read mRNA and synthesize proteins. Found free in cytoplasm or attached to rough ER.')],
  },

  // ── Genetics ──
  { chapterKey: 'Biology/Genetics', difficulty: 'EASY', tagNames: ['Theory', 'Important'],
    question: [text("Mendel's law of segregation states that:")],
    options: [
      opt('A', [text('Genes for different traits are inherited independently')]),
      opt('B', [text('Two alleles for each trait separate during gamete formation')], true),
      opt('C', [text('Dominant alleles always mask recessive ones')]),
      opt('D', [text('Genes are located on chromosomes')]),
    ],
    explanation: [text("Mendel's first law (Segregation): the two alleles for a trait separate during gamete formation so each gamete carries only one allele for each trait.")],
  },
  { chapterKey: 'Biology/Genetics', difficulty: 'MEDIUM', tagNames: ['Numerical', 'High Weightage'],
    question: [text('In a monohybrid cross between two heterozygotes (Aa × Aa), the phenotypic ratio is:')],
    options: [
      opt('A', [text('1:2:1')]),
      opt('B', [text('3:1')], true),
      opt('C', [text('1:1')]),
      opt('D', [text('2:1:1')]),
    ],
    explanation: [text('Aa × Aa → AA : Aa : aa = 1:2:1 (genotypic). Phenotypically, AA and Aa both show dominant phenotype → 3 dominant : 1 recessive = 3:1')],
  },
  { chapterKey: 'Biology/Genetics', difficulty: 'HARD', tagNames: ['Concept Based'],
    question: [text('The central dogma of molecular biology describes information flow as:')],
    options: [
      opt('A', [text('Protein → RNA → DNA')]),
      opt('B', [text('RNA → DNA → Protein')]),
      opt('C', [text('DNA → RNA → Protein')], true),
      opt('D', [text('DNA → Protein → RNA')]),
    ],
    explanation: [text('Central dogma: DNA → (transcription) → RNA → (translation) → Protein. Reverse transcription (RNA → DNA) occurs in retroviruses as an exception.')],
  },
  { chapterKey: 'Biology/Genetics', difficulty: 'MEDIUM', tagNames: ['Application'],
    question: [text('A person with blood group AB has which alleles?')],
    options: [
      opt('A', [text('Iᴬ Iᴬ')]),
      opt('B', [text('Iᴮ Iᴮ')]),
      opt('C', [text('Iᴬ Iᴮ')], true),
      opt('D', [text('Iᴬ i')]),
    ],
    explanation: [text('Blood group AB has codominant alleles Iᴬ and Iᴮ. Both are expressed. AB is universal recipient. O (ii) is universal donor.')],
  },
  { chapterKey: 'Biology/Genetics', difficulty: 'EASY', tagNames: ['Theory'],
    question: [text('The theory of evolution by natural selection was proposed by:')],
    options: [
      opt('A', [text('Gregor Mendel')]),
      opt('B', [text('Charles Darwin')], true),
      opt('C', [text('Thomas Morgan')]),
      opt('D', [text('Francis Crick')]),
    ],
    explanation: [text('Charles Darwin proposed natural selection in "On the Origin of Species" (1859). Organisms best adapted to their environment survive and reproduce more.')],
  },

  // ── Plant Physiology ──
  { chapterKey: 'Biology/Plant Physiology', difficulty: 'EASY', tagNames: ['Theory', 'Important'],
    question: [text('The primary site of photosynthesis in leaves is the:')],
    options: [
      opt('A', [text('Epidermis')]),
      opt('B', [text('Stomata')]),
      opt('C', [text('Chloroplast')], true),
      opt('D', [text('Vacuole')]),
    ],
    explanation: [text('Photosynthesis occurs in chloroplasts, specifically in the thylakoid membranes (light reactions) and stroma (Calvin cycle).')],
  },
  { chapterKey: 'Biology/Plant Physiology', difficulty: 'MEDIUM', tagNames: ['Concept Based'],
    question: [text('Which gas is released during the light reactions of photosynthesis?')],
    options: [
      opt('A', [text('CO₂')]),
      opt('B', [text('N₂')]),
      opt('C', [text('O₂')], true),
      opt('D', [text('CH₄')]),
    ],
    explanation: [text('Light reactions split water (photolysis): 2H₂O → 4H⁺ + 4e⁻ + O₂. Oxygen is released as a by-product.')],
  },
  { chapterKey: 'Biology/Plant Physiology', difficulty: 'HARD', tagNames: ['Application'],
    question: [text('C4 plants are better adapted to hot climates because they:')],
    options: [
      opt('A', [text('Have higher chlorophyll content')]),
      opt('B', [text('Minimise photorespiration by concentrating CO₂ around RuBisCO')], true),
      opt('C', [text('Perform photosynthesis at night')]),
      opt('D', [text('Use less water')]),
    ],
    explanation: [text('C4 plants (sugarcane, maize) fix CO₂ in mesophyll cells, then concentrate it around RuBisCO in bundle sheath cells, suppressing photorespiration at high temperatures.')],
  },
  { chapterKey: 'Biology/Plant Physiology', difficulty: 'MEDIUM', tagNames: ['Theory'],
    question: [text('The process of water movement from roots to leaves against gravity is mainly driven by:')],
    options: [
      opt('A', [text('Root pressure alone')]),
      opt('B', [text('Osmosis in xylem')]),
      opt('C', [text('Transpiration pull (cohesion-tension theory)')], true),
      opt('D', [text('Active transport in xylem')]),
    ],
    explanation: [text('Water ascent in tall plants is primarily explained by transpiration pull — evaporation from leaves creates tension that pulls the water column up through cohesion.')],
  },
  { chapterKey: 'Biology/Plant Physiology', difficulty: 'EASY', tagNames: ['Memory Based'],
    question: [text('Which plant hormone promotes cell elongation and is responsible for phototropism?')],
    options: [
      opt('A', [text('Cytokinin')]),
      opt('B', [text('Gibberellin')]),
      opt('C', [text('Auxin')], true),
      opt('D', [text('Abscisic acid')]),
    ],
    explanation: [text('Auxin (IAA) promotes cell elongation. In phototropism, auxin accumulates on the shaded side → more elongation → bending toward light.')],
  },

  // ── Human Physiology ──
  { chapterKey: 'Biology/Human Physiology', difficulty: 'EASY', tagNames: ['Theory', 'Important'],
    question: [text('The process of digestion of starch begins in the:')],
    options: [
      opt('A', [text('Stomach')]),
      opt('B', [text('Small intestine')]),
      opt('C', [text('Mouth')], true),
      opt('D', [text('Large intestine')]),
    ],
    explanation: [text('Salivary amylase (ptyalin) in saliva begins starch digestion in the mouth, breaking it down into maltose. Digestion continues in the small intestine.')],
  },
  { chapterKey: 'Biology/Human Physiology', difficulty: 'MEDIUM', tagNames: ['Concept Based', 'High Weightage'],
    question: [text('The SA node in the heart is known as the:')],
    options: [
      opt('A', [text('AV node')]),
      opt('B', [text('Bundle of His')]),
      opt('C', [text('Pacemaker')], true),
      opt('D', [text('Purkinje fibres')]),
    ],
    explanation: [text('The sinoatrial (SA) node generates electrical impulses that initiate each heartbeat, making it the natural pacemaker. Normal rate: 70-80 beats/min.')],
  },
  { chapterKey: 'Biology/Human Physiology', difficulty: 'HARD', tagNames: ['Application'],
    question: [text('In the nephron, glucose reabsorption occurs primarily in the:')],
    options: [
      opt('A', [text('Bowman\'s capsule')]),
      opt('B', [text('Proximal convoluted tubule')], true),
      opt('C', [text('Loop of Henle')]),
      opt('D', [text('Collecting duct')]),
    ],
    explanation: [text('Glucose is completely reabsorbed in the proximal convoluted tubule (PCT) by active transport. Under normal blood glucose levels, no glucose appears in urine.')],
  },
  { chapterKey: 'Biology/Human Physiology', difficulty: 'MEDIUM', tagNames: ['Theory'],
    question: [text('Which hormone regulates blood glucose levels by promoting its cellular uptake?')],
    options: [
      opt('A', [text('Glucagon')]),
      opt('B', [text('Cortisol')]),
      opt('C', [text('Insulin')], true),
      opt('D', [text('Thyroxine')]),
    ],
    explanation: [text('Insulin (from β cells of islets of Langerhans) promotes glucose uptake by cells, glycogen synthesis, and lowers blood glucose. Glucagon does the opposite.')],
  },
  { chapterKey: 'Biology/Human Physiology', difficulty: 'EASY', tagNames: ['Memory Based'],
    question: [text('The functional unit of the kidney is:')],
    options: [
      opt('A', [text('Neuron')]),
      opt('B', [text('Nephron')], true),
      opt('C', [text('Glomerulus')]),
      opt('D', [text('Alveolus')]),
    ],
    explanation: [text('Each kidney contains about 1 million nephrons, which are the structural and functional units responsible for filtration, reabsorption, and secretion.')],
  },

  // ── Ecology ──
  { chapterKey: 'Biology/Ecology', difficulty: 'EASY', tagNames: ['Theory'],
    question: [text('Which trophic level do primary producers occupy?')],
    options: [
      opt('A', [text('Second')]),
      opt('B', [text('Third')]),
      opt('C', [text('First')], true),
      opt('D', [text('Fourth')]),
    ],
    explanation: [text('Primary producers (plants, algae) occupy the first trophic level. Herbivores are second, carnivores third, and apex predators fourth.')],
  },
  { chapterKey: 'Biology/Ecology', difficulty: 'MEDIUM', tagNames: ['Concept Based', 'High Weightage'],
    question: [text('The concept of "ecological niche" refers to:')],
    options: [
      opt('A', [text('The physical location where an organism lives')]),
      opt('B', [text('The functional role and position of an organism in its ecosystem')], true),
      opt('C', [text('The number of offspring an organism produces')]),
      opt('D', [text('The food an organism eats')]),
    ],
    explanation: [text('Ecological niche encompasses not just where an organism lives (habitat) but what it does — its feeding habits, interactions, activity periods, etc.')],
  },
  { chapterKey: 'Biology/Ecology', difficulty: 'HARD', tagNames: ['Application', 'Important'],
    question: [text('The 10% energy transfer rule in food chains means:')],
    options: [
      opt('A', [text('10% of organisms survive to the next trophic level')]),
      opt('B', [text('Only 10% of energy is transferred to the next trophic level')], true),
      opt('C', [text('10% of food is wasted at each level')]),
      opt('D', [text('Populations decrease by 10% each generation')]),
    ],
    explanation: [text('Lindemann\'s 10% law: only ~10% of energy at one trophic level is available to the next. Remaining 90% is lost as heat, waste, or used for respiration.')],
  },
  { chapterKey: 'Biology/Ecology', difficulty: 'MEDIUM', tagNames: ['Theory'],
    question: [text('Which of the following is a greenhouse gas?')],
    options: [
      opt('A', [text('Nitrogen (N₂)')]),
      opt('B', [text('Oxygen (O₂)')]),
      opt('C', [text('Carbon dioxide (CO₂)')], true),
      opt('D', [text('Argon (Ar)')]),
    ],
    explanation: [text('CO₂, CH₄, N₂O, and water vapour are greenhouse gases. N₂ and O₂ (major atmospheric components) are NOT greenhouse gases.')],
  },
  { chapterKey: 'Biology/Ecology', difficulty: 'EASY', tagNames: ['Memory Based'],
    question: [text('Biodiversity hotspots are regions that:')],
    options: [
      opt('A', [text('Have the hottest climate')]),
      opt('B', [text('Are rich in species but threatened by habitat loss')], true),
      opt('C', [text('Have the highest rainfall')]),
      opt('D', [text('Contain only endemic species')]),
    ],
    explanation: [text('Biodiversity hotspots (defined by Myers et al.) must have ≥1500 endemic plant species AND have lost ≥70% of original habitat. India\'s hotspots include Western Ghats and Himalayas.')],
  },
];

// ─── Subject → relevant exam categories mapping ────────────────────────────────
// Controls which exam categories a subject's MCQs are mapped to.
// Adjust this if your exam setup differs.
const SUBJECT_EXAM_CATEGORIES: Record<string, string[]> = {
  Physics:     ['ENGINEERING', 'MEDICAL'],
  Chemistry:   ['ENGINEERING', 'MEDICAL'],
  Mathematics: ['ENGINEERING'],
  Biology:     ['MEDICAL'],
};
// Fallback: if a subject isn't in the map above, use all exam categories.

// ─── Main seeder ──────────────────────────────────────────────────────────────

async function seedMCQs() {
  const db = await getAdapter();

  // Load all tags by name
  console.log('Loading tags...');
  const tagMap = new Map<string, string>(); // name → id
  // We need raw collection access — use low-level findByField in a loop
  // Instead, re-load tags via sequential findByField calls (adapter-agnostic)
  for (const tagName of ['Concept Based', 'Numerical', 'Formula Based', 'Previous Year', 'High Weightage', 'Diagram Based', 'Theory', 'Application', 'Memory Based', 'Important']) {
    const tag = await db.findByField('tags', 'name', tagName);
    if (tag) tagMap.set(tagName, tag.id);
  }
  console.log(`  ${tagMap.size} tags loaded`);

  // Load all active exams
  console.log('Loading exams...');
  const examNames = ['JEE Main', 'JEE Advanced', 'NEET-UG', 'BITSAT', 'MHT-CET', 'KCET', 'VITEEE', 'CAT', 'SBI PO', 'UPSC CSE', 'NTSE', 'AIIMS MBBS', 'JIPMER', 'XAT', 'MAT', 'IBPS PO', 'RBI Grade B', 'SSC CGL', 'NDA'];
  const examInfo = new Map<string, { name: string; category: string; subjectIds: string[] }>();
  for (const name of examNames) {
    const exam = await db.findByField('exams', 'name', name);
    if (exam && exam.isActive) {
      examInfo.set(exam.id, {
        name: exam.name as string,
        category: (exam.category as string) ?? 'OTHER',
        subjectIds: (exam.subjectIds as string[]) ?? [],
      });
    }
  }
  console.log(`  ${examInfo.size} exams loaded`);

  // Load subjects: id → name, name → id
  console.log('\nLoading subjects...');
  const subjectNames = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
  const subjectByName = new Map<string, string>(); // name → id
  const subjectNameById = new Map<string, string>(); // id → name
  for (const name of subjectNames) {
    const subject = await db.findByField('subjects', 'name', name);
    if (subject) {
      subjectByName.set(name, subject.id);
      subjectNameById.set(subject.id, name);
    }
  }

  // Load all depth-0 topics (chapters)
  console.log('\nLoading topics...');
  const topicMap = new Map<string, { id: string; subjectId: string; path: string[]; pathNames: string[]; name: string }>();
  const chapterNames = [
    'Mechanics', 'Waves & Oscillations', 'Thermodynamics', 'Electrostatics', 'Current Electricity', 'Magnetism', 'Optics', 'Modern Physics',
    'Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry',
    'Algebra', 'Calculus', 'Coordinate Geometry', 'Trigonometry', 'Vectors & 3D', 'Statistics & Probability',
    'Cell Biology', 'Genetics', 'Plant Physiology', 'Human Physiology', 'Ecology',
  ];
  for (const [subjectName, subjectId] of subjectByName.entries()) {
    for (const chapterName of chapterNames) {
      const topic = await db.findByFields('topics', { subjectId, name: chapterName });
      if (topic) {
        topicMap.set(`${subjectName}/${chapterName}`, {
          id: topic.id,
          subjectId: topic.subjectId as string,
          path: (topic.path as string[]) ?? [],
          pathNames: (topic.pathNames as string[]) ?? [],
          name: topic.name as string,
        });
      }
    }
  }
  console.log(`  ${topicMap.size} chapters loaded`);

  // Build subject → relevant exam IDs
  const examsBySubject = new Map<string, string[]>(); // subjectId → examIds
  for (const [subjectName, subjectId] of subjectByName.entries()) {
    const allowedCategories = SUBJECT_EXAM_CATEGORIES[subjectName] ?? null;
    const relevantExamIds: string[] = [];
    for (const [examId, info] of examInfo.entries()) {
      const subjectInExam = info.subjectIds.includes(subjectId);
      const categoryMatches = allowedCategories === null || allowedCategories.includes(info.category);
      if (subjectInExam && categoryMatches) relevantExamIds.push(examId);
    }
    if (relevantExamIds.length > 0) {
      examsBySubject.set(subjectId, relevantExamIds);
      console.log(`  ${subjectName} → [${relevantExamIds.map((id) => examInfo.get(id)?.name).join(', ')}]`);
    }
  }
  console.log();

  console.log('\n── Creating MCQs ─────────────────────────────');
  let created = 0;
  let skipped = 0;

  for (const raw of CHAPTER_MCQS) {
    const topic = topicMap.get(raw.chapterKey);
    if (!topic) {
      console.log(`  WARN: topic not found for key "${raw.chapterKey}" — run seed-all.ts first`);
      continue;
    }

    const topicPath = [...topic.path, topic.id];
    const topicPathNames = [...topic.pathNames, topic.name];
    const resolvedTagIds = raw.tagNames.map((n) => tagMap.get(n)).filter(Boolean) as string[];
    const examIdsForSubject = examsBySubject.get(topic.subjectId) ?? [];

    // Check duplicate by question text + topicId
    const questionText = raw.question.map((b) => b.content).join(' ');
    const dup = await db.findByFields('mcqs', { topicId: topic.id, _questionText: questionText });
    if (dup) {
      console.log(`  SKIP  [${raw.chapterKey}] "${questionText.slice(0, 40)}..."`);
      skipped++;
      continue;
    }

    const now = nowIso();
    const id = generateId();
    await db.insert('mcqs', {
      id,
      subjectId: topic.subjectId,
      topicId: topic.id,
      topicPath,
      topicPathNames,
      examIds: examIdsForSubject,
      examSectionIds: [],
      difficultyPerExam: {},
      questionType: 'SINGLE',
      difficulty: raw.difficulty,
      question: raw.question,
      options: raw.options,
      explanation: raw.explanation,
      hint: [],
      tagIds: resolvedTagIds,
      source: 'Seed data',
      isPreviousYear: false,
      previousYearExam: null,
      previousYearYear: null,
      isActive: true,
      isVerified: true,
      createdBy: 'seed',
      verifiedBy: 'seed',
      usageCount: 0,
      attemptCount: 0,
      correctCount: 0,
      accuracyRate: 0,
      avgTimeTakenSeconds: 0,
      _questionText: questionText,
    });

    // Increment topic MCQ count
    const topicDoc = await db.findByField('topics', 'id', topic.id);
    await db.update('topics', topic.id, { mcqCount: ((topicDoc?.mcqCount as number) ?? 0) + 1 });

    console.log(`  CREATE [${raw.chapterKey}] ${raw.difficulty} "${questionText.slice(0, 50)}"`);
    created++;
  }

  // Update subject mcqCounts
  console.log('\nUpdating subject MCQ counts...');
  for (const [subjectName, subjectId] of subjectByName.entries()) {
    const count = await db.countByField('mcqs', 'subjectId', subjectId);
    await db.update('subjects', subjectId, { mcqCount: count });
    console.log(`  ${subjectName}: ${count} MCQs`);
  }

  console.log(`\n✓ Done: ${created} created, ${skipped} skipped.\n`);
}

seedMCQs().catch((e) => { console.error(e); process.exit(1); });
