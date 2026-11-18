/**
 * Detailed chapter mind maps for CBSE Class 10 and Class 12 — at least two chapters per
 * subject. Facts follow the NCERT textbooks (2023-24 rationalised editions) and the CBSE
 * curriculum; review before relying on them, like any editor-written content.
 *
 * Shape: a point is a string (a leaf fact) or an object:
 *   l     label
 *   link  name of an existing curriculum topic/subtopic in that chapter to link to
 *   d     short description (hover card / flashcard back)
 *   h     heading style · dash  dashed border (sub-lists) · mark  highlight
 *   tags  e.g. ['Important']
 *   c     children
 */

export type Point = string | { l: string; link?: string; d?: string; h?: boolean; dash?: boolean; mark?: boolean; tags?: string[]; c?: Point[] };

export interface ChapterMapSpec {
  exam: 'cbse-class-10-board' | 'cbse-class-12-board';
  /** Subject slug in the syllabus. */
  subject: string;
  /** Chapter name exactly as in the syllabus. */
  chapter: string;
  nodes: Point[];
}

const C10 = 'cbse-class-10-board' as const;
const C12 = 'cbse-class-12-board' as const;

export const CBSE_MIND_MAPS: ChapterMapSpec[] = [
  // ═══════════════════════════ CLASS 10 · SCIENCE ═══════════════════════════
  {
    exam: C10,
    subject: 'science-class-10',
    chapter: 'Life Processes',
    nodes: [
      { l: 'What are Life Processes?', link: 'What are Life Processes?', c: ['Life processes maintain the body: nutrition, respiration, transportation and excretion', 'Energy from food is needed even while we sleep'] },
      {
        l: 'Nutrition',
        link: 'Nutrition (Life Processes)',
        c: [
          {
            l: 'Autotrophic Nutrition',
            link: 'Autotrophic Nutrition',
            c: [
              'Green plants make their own food by photosynthesis',
              { l: '6CO₂ + 12H₂O → C₆H₁₂O₆ + 6O₂ + 6H₂O (sunlight, chlorophyll)', mark: true },
              'Stomata on leaves allow exchange of gases',
              'Extra glucose is stored as starch',
            ],
          },
          { l: 'Heterotrophic Nutrition', link: 'Heterotrophic Nutrition', c: ['Organisms depend on others for food', 'Types: saprotrophic (fungi), parasitic (Cuscuta, ticks) and holozoic'] },
          {
            l: 'How do Organisms obtain their Nutrition?',
            link: 'How do Organisms obtain their Nutrition?',
            c: ['Amoeba engulfs food with pseudopodia into a food vacuole', 'Paramoecium uses cilia to move food to a specific spot'],
          },
          {
            l: 'Nutrition in Human Beings',
            link: 'Nutrition in Human Beings',
            c: [
              'Salivary amylase breaks starch into sugar',
              'The stomach secretes hydrochloric acid, pepsin and mucus',
              'Bile from the liver emulsifies fats',
              'Villi in the small intestine increase the surface for absorption',
            ],
          },
        ],
      },
      {
        l: 'Respiration',
        link: 'Respiration (Life Processes)',
        c: [
          {
            l: 'Aerobic and Anaerobic Respiration',
            link: 'Aerobic and Anaerobic Respiration',
            c: [
              'Glucose is first broken into pyruvate (a three-carbon molecule) in the cytoplasm',
              'Yeast (no oxygen): pyruvate → ethanol + CO₂ + energy',
              'Muscles (lack of oxygen): pyruvate → lactic acid, causing cramps',
              'Mitochondria (oxygen): pyruvate → CO₂ + water + energy',
              'Energy is stored as ATP',
            ],
          },
          {
            l: 'Human Respiratory System',
            link: 'Human Respiratory System',
            c: ['Air path: nostrils → pharynx → larynx → trachea → bronchi → bronchioles → alveoli', 'Rings of cartilage stop the air passage from collapsing', 'Alveoli give a large surface for gas exchange', 'Haemoglobin in red blood cells carries oxygen'],
          },
        ],
      },
      {
        l: 'Transportation',
        link: 'Transportation (Life Processes)',
        c: [
          {
            l: 'Transportation in Human Beings',
            link: 'Transportation in Human Beings',
            c: [
              'The human heart has four chambers',
              'Double circulation: blood passes through the heart twice in each cycle',
              'Arteries carry blood away from the heart; veins bring it back',
              'Platelets help blood to clot',
              'Lymph carries digested fat and drains excess tissue fluid',
            ],
          },
          { l: 'Transportation in Plants', link: 'Transportation in Plants', c: ['Xylem carries water and minerals up from the roots', 'Phloem carries food (translocation)', 'Transpiration helps pull water upward'] },
        ],
      },
      {
        l: 'Excretion',
        link: 'Excretion (Life Processes)',
        c: [
          { l: 'Excretion in Human Beings', link: 'Excretion in Human Beings', c: ['Nephrons are the filtering units of the kidneys', 'Urine flows through the ureters to the urinary bladder', 'Dialysis (artificial kidney) is used when kidneys fail'] },
          { l: 'Excretion in Plants', link: 'Excretion in Plants', c: ['Excess water is lost by transpiration', 'Some wastes are stored in leaves that fall off, or as resins and gums'] },
        ],
      },
    ],
  },
  {
    exam: C10,
    subject: 'science-class-10',
    chapter: 'Electricity',
    nodes: [
      {
        l: 'Electric Current and Circuit',
        link: 'Electric Current and Circuit',
        c: ['Electric current is the rate of flow of charge: I = Q/t', 'SI unit of current is the ampere (A)', 'An ammeter is connected in series', 'One coulomb is the charge of about 6 × 10¹⁸ electrons'],
      },
      { l: 'Electric Potential and Potential Difference', link: 'Electric Potential and Potential Difference', c: ['Potential difference V = W/Q', 'SI unit is the volt: 1 V = 1 J/C', 'A voltmeter is connected in parallel'] },
      { l: 'Circuit Diagram', link: 'Circuit Diagram', c: ['Standard symbols show cells, keys, resistors, bulbs, ammeters and voltmeters'] },
      { l: "Ohm's Law", link: "Ohm's Law (Class 10)", c: [{ l: 'At constant temperature V ∝ I, so V = IR', mark: true }, 'SI unit of resistance is the ohm (Ω)', 'A rheostat varies resistance in a circuit'] },
      {
        l: 'Factors Affecting Resistance',
        link: 'Factors on which the Resistance of a Conductor Depends',
        c: ['R = ρl/A: resistance grows with length and falls with area of cross-section', 'Resistivity ρ is measured in Ω m', 'Alloys like nichrome have high resistivity'],
      },
      {
        l: 'Resistance of a System of Resistors',
        link: 'Resistance of a System of Resistors',
        c: [
          { l: 'Resistors in Series', link: 'Resistors in Series', c: ['Rs = R₁ + R₂ + R₃', 'The same current flows through each resistor'] },
          { l: 'Resistors in Parallel', link: 'Resistors in Parallel', c: ['1/Rp = 1/R₁ + 1/R₂ + 1/R₃', 'The potential difference across each resistor is the same', 'Household appliances are connected in parallel'] },
        ],
      },
      {
        l: 'Heating Effect of Electric Current',
        link: 'Heating Effect of Electric Current',
        c: [
          "Joule's law of heating: H = I²Rt",
          {
            l: 'Practical Applications',
            link: 'Practical Applications of Heating Effect of Electric Current',
            c: ['Electric iron, toaster, heater and bulb', 'A fuse melts and breaks the circuit when the current is too high', 'Bulb filaments are made of tungsten (melting point 3380 °C)'],
          },
        ],
      },
      { l: 'Electric Power', link: 'Electric Power (Class 10)', c: ['P = VI = I²R = V²/R', 'SI unit of power is the watt (W)', { l: '1 kWh = 3.6 × 10⁶ J', tags: ['Important'] }] },
    ],
  },
  {
    exam: C10,
    subject: 'science-class-10',
    chapter: 'Chemical Reactions and Equations',
    nodes: [
      {
        l: 'Chemical Equations',
        link: 'Chemical Equations',
        c: [
          { l: 'Writing a Chemical Equation', link: 'Writing a Chemical Equation', c: ['Reactants on the left, products on the right', 'Physical states are shown as (s), (l), (g) and (aq)'] },
          {
            l: 'Balanced Chemical Equations',
            link: 'Balanced Chemical Equations',
            c: ['Mass is neither created nor destroyed in a reaction', 'Atoms of each element are equal on both sides', '3Fe + 4H₂O → Fe₃O₄ + 4H₂'],
          },
        ],
      },
      {
        l: 'Types of Chemical Reactions',
        link: 'Types of Chemical Reactions',
        c: [
          { l: 'Combination Reaction', link: 'Combination Reaction', c: ['Two or more reactants form a single product', 'CaO + H₂O → Ca(OH)₂ (slaked lime) releases heat'] },
          {
            l: 'Decomposition Reaction',
            link: 'Decomposition Reaction',
            c: ['A single reactant breaks into simpler products', 'Thermal: CaCO₃ → CaO + CO₂', 'Electrolysis of water gives hydrogen and oxygen in the ratio 2:1 by volume', 'Silver chloride turns grey in sunlight'],
          },
          { l: 'Displacement Reaction', link: 'Displacement Reaction', c: ['A more reactive element displaces a less reactive one', 'Fe + CuSO₄ → FeSO₄ + Cu: blue solution turns green'] },
          { l: 'Double Displacement Reaction', link: 'Double Displacement Reaction', c: ['Ions are exchanged between two compounds', 'Na₂SO₄ + BaCl₂ → BaSO₄ (white precipitate) + 2NaCl'] },
          {
            l: 'Oxidation and Reduction',
            link: 'Oxidation and Reduction',
            c: ['Oxidation: gain of oxygen or loss of hydrogen', 'Reduction: loss of oxygen or gain of hydrogen', 'CuO + H₂ → Cu + H₂O is a redox reaction'],
          },
          { l: 'Exothermic and Endothermic', c: ['Exothermic reactions release heat, e.g. respiration', 'Most decomposition reactions are endothermic'] },
        ],
      },
      {
        l: 'Effects of Oxidation in Everyday Life',
        link: 'Effects of Oxidation Reactions in Everyday Life',
        c: [
          { l: 'Corrosion', link: 'Corrosion', c: ['Rusting of iron needs both air and moisture', 'Painting, oiling and galvanising prevent rusting'] },
          { l: 'Rancidity', link: 'Rancidity', c: ['Oxidised fats and oils smell and taste bad', 'Prevented by antioxidants, airtight containers and nitrogen in chip packets'] },
        ],
      },
    ],
  },
  {
    exam: C10,
    subject: 'science-class-10',
    chapter: 'Light: Reflection and Refraction',
    nodes: [
      { l: 'Reflection of Light', link: 'Reflection of Light', c: ['Angle of incidence equals angle of reflection', 'Incident ray, reflected ray and normal lie in the same plane'] },
      {
        l: 'Spherical Mirrors',
        link: 'Spherical Mirrors',
        c: [
          {
            l: 'Image Formation by Spherical Mirrors',
            link: 'Image Formation by Spherical Mirrors',
            c: ['A concave mirror forms real, inverted images, except for an object between P and F', 'A convex mirror always forms virtual, erect, diminished images'],
          },
          {
            l: 'Ray Diagrams for Spherical Mirrors',
            link: 'Ray Diagrams for Spherical Mirrors',
            c: ['A ray parallel to the principal axis passes through the focus after reflection', 'A ray through the centre of curvature is reflected back along itself'],
          },
          {
            l: 'Sign Convention for Reflection by Spherical Mirrors',
            link: 'Sign Convention for Reflection by Spherical Mirrors',
            c: ['All distances are measured from the pole', 'Distances along the incident light are positive', 'Object distance u is usually negative'],
          },
          { l: 'Mirror Formula and Magnification', link: 'Mirror Formula and Magnification', c: [{ l: '1/v + 1/u = 1/f', mark: true }, 'R = 2f', 'Magnification m = h′/h = −v/u'] },
          { l: 'Uses of Mirrors', c: ['Concave: torches, shaving mirrors, dentists, solar furnaces', 'Convex: rear-view mirrors, for a wider field of view'] },
        ],
      },
      {
        l: 'Refraction of Light',
        link: 'Refraction of Light',
        c: [
          { l: 'Refraction through a Rectangular Glass Slab', link: 'Refraction through a Rectangular Glass Slab', c: ['The emergent ray is parallel to the incident ray but laterally displaced'] },
          {
            l: 'The Refractive Index',
            link: 'The Refractive Index',
            c: ['n = speed of light in vacuum / speed of light in the medium', 'Light bends towards the normal entering a denser medium', 'Refractive index of crown glass is about 1.52'],
          },
          { l: 'Refraction by Spherical Lenses', link: 'Refraction by Spherical Lenses', c: ['A convex lens converges light; a concave lens diverges it'] },
          {
            l: 'Image Formation by Lenses',
            link: 'Image Formation by Lenses',
            c: ['A convex lens gives a virtual, magnified image for an object between F and O', 'A concave lens always gives a virtual, erect, diminished image'],
          },
          { l: 'Ray Diagrams for Lenses', link: 'Ray Diagrams for Lenses', c: ['A ray through the optical centre passes undeviated'] },
          { l: 'Sign Convention for Spherical Lenses', link: 'Sign Convention for Spherical Lenses', c: ['Focal length is positive for a convex lens and negative for a concave lens'] },
          { l: 'Lens Formula and Magnification', link: 'Lens Formula and Magnification', c: [{ l: '1/v − 1/u = 1/f', mark: true }, 'm = h′/h = v/u'] },
          { l: 'Power of a Lens', link: 'Power of a Lens', c: ['P = 1/f, with f in metres', 'SI unit of power is the dioptre (D)', 'Powers of lenses in contact add: P = P₁ + P₂'] },
        ],
      },
    ],
  },
  {
    exam: C10,
    subject: 'science-class-10',
    chapter: 'Magnetic Effects of Electric Current',
    nodes: [
      { l: 'Magnetic Field and Field Lines', c: ['Field lines leave the north pole and enter the south pole', 'Field lines never intersect', 'Crowded field lines mean a stronger field'] },
      {
        l: 'Field due to a Current-carrying Conductor',
        c: [
          'Oersted showed in 1820 that a current produces a magnetic field',
          'Right-hand thumb rule gives the field direction around a straight wire',
          'A current-carrying solenoid behaves like a bar magnet',
          'A strong field inside a solenoid makes an electromagnet',
        ],
      },
      { l: 'Force on a Current-carrying Conductor', c: ['The force is greatest when current is perpendicular to the field', { l: "Fleming's left-hand rule gives the direction of the force", mark: true }, 'Used in electric motors and loudspeakers'] },
      {
        l: 'Domestic Electric Circuits',
        c: [
          'Live wire: red insulation; neutral: black; earth: green',
          'Potential difference between live and neutral in India is 220 V',
          'The earth wire protects users from electric shocks',
          'Fuses and MCBs protect against overloading and short circuits',
        ],
      },
    ],
  },

  // ═══════════════════════════ CLASS 10 · MATHEMATICS ═══════════════════════════
  {
    exam: C10,
    subject: 'mathematics-class-10',
    chapter: 'Real Numbers',
    nodes: [
      {
        l: 'The Fundamental Theorem of Arithmetic',
        link: 'The Fundamental Theorem of Arithmetic',
        c: [
          { l: 'Every composite number is a product of primes, unique apart from order', mark: true },
          { l: 'Prime Factorisation', link: 'Prime Factorisation', c: ['Example: 140 = 2 × 2 × 5 × 7 = 2² × 5 × 7'] },
          {
            l: 'HCF and LCM by Prime Factorisation',
            link: 'HCF and LCM by Prime Factorisation',
            c: ['HCF = product of the smallest power of each common prime factor', 'LCM = product of the greatest power of each prime factor', { l: 'HCF(a, b) × LCM(a, b) = a × b', tags: ['Important'] }],
          },
        ],
      },
      {
        l: 'Revisiting Irrational Numbers',
        link: 'Revisiting Irrational Numbers',
        c: [
          'Irrational: cannot be written as p/q with integers p, q and q ≠ 0',
          'If a prime p divides a², then p divides a',
          { l: 'Proving Irrationality of Numbers', link: 'Proving Irrationality of Numbers', c: ['√2, √3 and √5 are proved irrational by contradiction', 'Sum of a rational and an irrational number is irrational', 'Product of a non-zero rational and an irrational number is irrational'] },
        ],
      },
    ],
  },
  {
    exam: C10,
    subject: 'mathematics-class-10',
    chapter: 'Pair of Linear Equations in Two Variables',
    nodes: [
      { l: 'General Form', c: ['a₁x + b₁y + c₁ = 0 and a₂x + b₂y + c₂ = 0', 'Each equation is a straight line'] },
      {
        l: 'Graphical Method of Solution',
        link: 'Graphical Method of Solution',
        c: [
          'Intersecting lines: exactly one solution (consistent)',
          'Coincident lines: infinitely many solutions (dependent)',
          'Parallel lines: no solution (inconsistent)',
          {
            l: 'Ratio test',
            c: [
              { l: 'a₁/a₂ ≠ b₁/b₂ → unique solution', dash: true },
              { l: 'a₁/a₂ = b₁/b₂ = c₁/c₂ → infinitely many solutions', dash: true },
              { l: 'a₁/a₂ = b₁/b₂ ≠ c₁/c₂ → no solution', dash: true },
            ],
          },
        ],
      },
      {
        l: 'Algebraic Methods',
        link: 'Algebraic Methods of Solving a Pair of Linear Equations',
        c: [
          { l: 'Substitution Method', link: 'Substitution Method', c: ['Express one variable in terms of the other', 'Substitute into the second equation and solve'] },
          { l: 'Elimination Method', link: 'Elimination Method', c: ['Make the coefficients of one variable equal', 'Add or subtract the equations to eliminate it'] },
        ],
      },
      { l: 'Word Problems', c: ['Age, fraction, speed–distance and cost problems lead to a pair of equations', 'Always check the answer in both original equations'] },
    ],
  },
  {
    exam: C10,
    subject: 'mathematics-class-10',
    chapter: 'Trigonometry',
    nodes: [
      {
        l: 'Trigonometric Ratios',
        c: ['sin A = opposite / hypotenuse', 'cos A = adjacent / hypotenuse', 'tan A = sin A / cos A', 'cosec A, sec A and cot A are reciprocals of sin A, cos A and tan A'],
      },
      { l: 'Ratios of Specific Angles', c: ['sin 30° = 1/2', 'cos 60° = 1/2', 'tan 45° = 1', 'sin 90° = 1 and cos 90° = 0', 'tan 90° is not defined'] },
      { l: 'Trigonometric Identities', c: [{ l: 'sin²A + cos²A = 1', mark: true }, '1 + tan²A = sec²A (0° ≤ A < 90°)', '1 + cot²A = cosec²A (0° < A ≤ 90°)'] },
      {
        l: 'Some Applications of Trigonometry',
        c: ['Line of sight joins the eye to the object', 'Angle of elevation: object above eye level', 'Angle of depression: object below eye level', 'Heights and distances are found with tan of these angles'],
      },
    ],
  },
  {
    exam: C10,
    subject: 'mathematics-class-10',
    chapter: 'Polynomials',
    nodes: [
      { l: 'Degree of a Polynomial', c: ['Linear: degree 1; quadratic: degree 2; cubic: degree 3', 'A polynomial of degree n has at most n zeroes'] },
      { l: 'Zeroes of a Polynomial', c: ['k is a zero of p(x) if p(k) = 0', 'Zeroes are where the graph of y = p(x) meets the x-axis', 'The graph of a quadratic is a parabola, opening upward when a > 0'] },
      {
        l: 'Zeroes and Coefficients',
        c: [
          { l: 'Quadratic ax² + bx + c', c: [{ l: 'Sum of zeroes α + β = −b/a', mark: true }, { l: 'Product of zeroes αβ = c/a', mark: true }, 'Quadratic with given zeroes: x² − (sum)x + (product)'] },
          { l: 'Cubic ax³ + bx² + cx + d', c: ['α + β + γ = −b/a', 'αβ + βγ + γα = c/a', 'αβγ = −d/a'] },
        ],
      },
    ],
  },

  // ═══════════════════════════ CLASS 10 · ENGLISH ═══════════════════════════
  {
    exam: C10,
    subject: 'english-class-10',
    chapter: 'Grammar',
    nodes: [
      {
        l: 'Tenses',
        c: ['Simple present: habits and universal truths — The sun rises in the east', 'Present perfect links past to present — I have finished my work', 'Past perfect shows the earlier of two past actions', 'Future: will, shall or be going to'],
      },
      { l: 'Modals', c: ['Can / could: ability and permission', 'May / might: possibility and permission', 'Must: obligation or strong certainty', 'Should / ought to: advice or duty', 'Modals are followed by the base form of the verb'] },
      {
        l: 'Subject–Verb Agreement',
        c: ['A singular subject takes a singular verb — She writes', 'Subjects joined by "and" take a plural verb', 'With either…or / neither…nor, the verb agrees with the nearer subject', 'Each, every, everyone and nobody take a singular verb'],
      },
      { l: 'Determiners', c: ['Articles: a, an, the', 'Demonstratives: this, that, these, those', 'Quantifiers: some, any, much, many, few, little', '"An" goes before a vowel sound: an hour, a university'] },
      {
        l: 'Reported Speech',
        c: ['A past reporting verb shifts tenses back: is → was', 'Questions become statements — He asked where I lived', 'Commands use "to" + verb — She told me to sit down', 'Time words change: now → then, today → that day'],
      },
      { l: 'Exam Practice', c: ['Editing: find the error and write the correction', 'Gap filling tests tenses, prepositions and determiners'] },
    ],
  },
  {
    exam: C10,
    subject: 'english-class-10',
    chapter: 'Writing Skills',
    nodes: [
      {
        l: 'Formal Letter',
        c: [
          { l: 'Format', h: true },
          "Sender's address, date, receiver's address, subject, salutation, body, complimentary close",
          'Letter to the editor raises a public issue',
          'Letter of complaint or enquiry goes to an organisation',
          'Keep the tone polite and to the point',
        ],
      },
      {
        l: 'Analytical Paragraph',
        c: ['Analyses a chart, graph, table or cue in about 100–120 words', 'Introduce, describe trends with figures, compare and conclude', 'Linking words: whereas, however, in contrast, overall'],
      },
      { l: 'Writing Tips', c: ['Plan before you write; use paragraphs', 'Stay within the word limit', 'Avoid informal words in formal writing', 'Revise spelling, grammar and punctuation'] },
    ],
  },

  // ═══════════════════════════ CLASS 10 · SOCIAL SCIENCE ═══════════════════════════
  {
    exam: C10,
    subject: 'social-science-class-10',
    chapter: 'Power Sharing',
    nodes: [
      {
        l: 'Belgium',
        c: [
          'Dutch-speaking 59%, French-speaking 40%, German-speaking 1%',
          'The constitution was amended four times between 1970 and 1993',
          'Equal numbers of Dutch and French-speaking ministers in the central government',
          'Brussels has a separate government with equal representation',
          'A community government handles cultural, educational and language matters',
        ],
      },
      { l: 'Sri Lanka', c: ['Sinhala speakers about 74%, Tamil speakers about 18%', 'An Act of 1956 made Sinhala the only official language', 'Majoritarian measures led to distrust and civil war'] },
      { l: 'Why Power Sharing is Desirable', c: [{ l: 'Prudential reason: it reduces conflict between social groups', mark: true }, { l: 'Moral reason: it is the very spirit of democracy', mark: true }] },
      {
        l: 'Forms of Power Sharing',
        c: [
          'Horizontal: legislature, executive and judiciary — checks and balances',
          'Vertical: governments at different levels — federalism',
          'Among social groups, e.g. reserved constituencies',
          'Among political parties, pressure groups and movements, e.g. coalitions',
        ],
      },
    ],
  },
  {
    exam: C10,
    subject: 'social-science-class-10',
    chapter: 'Resources and Development',
    nodes: [
      {
        l: 'Types of Resources',
        c: ['Origin: biotic and abiotic', 'Exhaustibility: renewable and non-renewable', 'Ownership: individual, community, national, international', 'Development: potential, developed, stock and reserves'],
      },
      { l: 'Resource Planning', c: ['Identify and inventory resources', 'Plan with technology, skills and institutions', 'Match plans with national development plans', 'The Rio de Janeiro Earth Summit (1992) adopted Agenda 21'] },
      { l: 'Land Resources', c: ['Plains about 43%, mountains about 30%, plateaus about 27% of India’s area', 'Land degradation: deforestation, overgrazing, mining, over-irrigation'] },
      {
        l: 'Soils of India',
        c: [
          { l: 'Alluvial soil: the most widespread; northern plains; very fertile', dash: true },
          { l: 'Black soil (regur): ideal for cotton; Deccan plateau; holds moisture', dash: true },
          { l: 'Red and yellow soil: red from iron, yellow when hydrated', dash: true },
          { l: 'Laterite soil: high temperature and heavy rain; tea and cashew', dash: true },
          { l: 'Arid soil: sandy and saline; Rajasthan', dash: true },
          { l: 'Forest soil: mountain areas', dash: true },
        ],
      },
      { l: 'Soil Conservation', c: ['Contour ploughing, terrace farming and strip cropping', 'Shelter belts of trees reduce wind erosion', 'Gullies make land unfit for farming (bad land / ravines)'] },
    ],
  },

  // ═══════════════════════════ CLASS 12 · PHYSICS ═══════════════════════════
  {
    exam: C12,
    subject: 'physics',
    chapter: 'Electrodynamics',
    nodes: [
      {
        l: 'Electrostatics',
        link: 'Electrostatics',
        c: ["Coulomb's law: F = kq₁q₂/r², k = 9 × 10⁹ N m² C⁻²", 'Electric field E = F/q', { l: "Gauss's law: total flux = q/ε₀", mark: true }, 'Parallel-plate capacitor: C = ε₀A/d', 'Energy stored in a capacitor: U = ½CV²'],
      },
      {
        l: 'Current Electricity',
        link: 'Current Electricity',
        c: ['Drift velocity: I = neAv_d', 'R = ρl/A', "Kirchhoff's junction rule: charge conservation", "Kirchhoff's loop rule: energy conservation", 'Wheatstone bridge balance: P/Q = R/S', 'Terminal voltage V = E − Ir'],
      },
      {
        l: 'Magnetic Effects of Current',
        link: 'Magnetic Effects of Current',
        c: [
          'Biot–Savart law gives the field of a current element',
          'Field at the centre of a circular loop: B = μ₀I/2R',
          "Ampere's circuital law: ∮B·dl = μ₀I",
          'Force on a moving charge: F = q(v × B)',
          'Field inside a long solenoid: B = μ₀nI',
          'Galvanometer → ammeter with a shunt; → voltmeter with a high series resistance',
        ],
      },
      {
        l: 'Electromagnetic Induction',
        link: 'Electromagnetic Induction',
        c: [{ l: "Faraday's law: ε = −dΦ/dt", mark: true }, "Lenz's law: the induced current opposes the change in flux", 'Motional emf: ε = Blv', 'Self-inductance of a solenoid: L = μ₀n²Al', 'Eddy currents: induction furnaces, magnetic braking'],
      },
      { l: 'Alternating Current', c: ['RMS current: I_rms = I₀/√2', 'Resonance in an LCR circuit when X_L = X_C', 'Transformer: Vs/Vp = Ns/Np'] },
    ],
  },
  {
    exam: C12,
    subject: 'physics',
    chapter: 'Optics',
    nodes: [
      {
        l: 'Ray Optics',
        link: 'Ray Optics',
        c: [
          'Mirror formula: 1/v + 1/u = 1/f',
          "Snell's law: n₁ sin i = n₂ sin r",
          { l: 'Total internal reflection: denser → rarer medium and i > critical angle', mark: true },
          'Optical fibres work by total internal reflection',
          "Lens maker's formula: 1/f = (n − 1)(1/R₁ − 1/R₂)",
          'Prism: n = sin((A + D)/2) / sin(A/2)',
        ],
      },
      {
        l: 'Wave Optics',
        link: 'Wave Optics',
        c: [
          "Huygens' principle: each point on a wavefront is a source of secondary wavelets",
          { l: "Young's double slit: fringe width β = λD/d", mark: true },
          'Constructive interference: path difference = nλ',
          'Single slit: first minimum at sin θ = λ/a',
          'Polarisation shows that light is a transverse wave',
          "Brewster's law: tan i_B = n",
        ],
      },
    ],
  },

  // ═══════════════════════════ CLASS 12 · CHEMISTRY ═══════════════════════════
  {
    exam: C12,
    subject: 'chemistry',
    chapter: 'Physical Chemistry',
    nodes: [
      {
        l: 'Solutions',
        c: [
          'Molarity: moles of solute per litre of solution',
          'Molality: moles of solute per kg of solvent',
          "Raoult's law: partial vapour pressure = mole fraction × vapour pressure of pure component",
          "Henry's law: p = K_H x",
          'Colligative properties depend on the number of solute particles',
          'Elevation in boiling point: ΔTb = Kb m',
          'Osmotic pressure: π = CRT',
        ],
      },
      {
        l: 'Electrochemistry',
        link: 'Electrochemistry',
        c: [
          { l: 'Nernst equation: E = E° − (0.059/n) log Q at 298 K', mark: true },
          'ΔG° = −nFE°',
          'The standard hydrogen electrode has E° = 0 V',
          "Kohlrausch's law: limiting molar conductivity is the sum of ionic contributions",
          "Faraday's first law: mass deposited ∝ charge passed",
          '1 faraday ≈ 96500 C',
        ],
      },
      {
        l: 'Chemical Kinetics',
        c: ['Rate = k[A]ˣ[B]ʸ; order = x + y', 'First-order half-life: t½ = 0.693/k', 'For a zero-order reaction, half-life is proportional to [A]₀', { l: 'Arrhenius equation: k = A e^(−Ea/RT)', mark: true }, 'A catalyst lowers the activation energy'],
      },
    ],
  },
  {
    exam: C12,
    subject: 'chemistry',
    chapter: 'Organic Chemistry',
    nodes: [
      {
        l: 'Haloalkanes and Haloarenes',
        c: ['SN2: one step, inversion of configuration', 'SN1: carbocation intermediate, racemisation', 'Tertiary halides react fastest by SN1', 'Chloroform is kept in dark bottles to stop phosgene forming'],
      },
      {
        l: 'Alcohols, Phenols and Ethers',
        link: 'Alcohols, Phenols and Ethers',
        c: ['Lucas test distinguishes primary, secondary and tertiary alcohols', 'Phenol is more acidic than ethanol: the phenoxide ion is resonance stabilised', 'Williamson synthesis: ethers from alkyl halides and alkoxides', 'Reimer–Tiemann reaction: phenol → salicylaldehyde'],
      },
      {
        l: 'Aldehydes, Ketones and Carboxylic Acids',
        link: 'Aldehydes, Ketones and Carboxylic Acids',
        c: [
          "Aldehydes give a silver mirror with Tollens' reagent",
          "Fehling's test: aliphatic aldehydes give a red-brown precipitate",
          'Aldol condensation needs an α-hydrogen',
          'Cannizzaro reaction: aldehydes without an α-hydrogen',
          'Electron-withdrawing groups increase the acidity of carboxylic acids',
        ],
      },
      { l: 'Amines', c: ["Hinsberg's reagent distinguishes primary, secondary and tertiary amines", 'Carbylamine (isocyanide) test: primary amines only', 'Aniline is a weaker base than ammonia', 'Diazonium salts are used to make azo dyes'] },
      {
        l: 'Biomolecules',
        link: 'Biomolecules',
        c: [
          'Glucose is an aldohexose; fructose is a ketohexose',
          'Sucrose is a non-reducing sugar',
          'Proteins are α-amino acids joined by peptide bonds',
          'DNA has deoxyribose and bases A, G, C, T; RNA has U instead of T',
          'Vitamins B and C are water-soluble',
        ],
      },
    ],
  },

  // ═══════════════════════════ CLASS 12 · BIOLOGY ═══════════════════════════
  {
    exam: C12,
    subject: 'biology',
    chapter: 'Genetics and Evolution',
    nodes: [
      {
        l: 'Principles of Inheritance',
        link: 'Principles of Inheritance',
        c: [
          'Mendel studied seven pairs of contrasting traits in pea plants',
          { l: 'Monohybrid F₂ phenotypic ratio 3:1', mark: true },
          { l: 'Dihybrid F₂ phenotypic ratio 9:3:3:1', mark: true },
          'Incomplete dominance: snapdragon flower colour, F₂ ratio 1:2:1',
          'ABO blood groups: co-dominance and multiple alleles',
          'Haemophilia and colour blindness are sex-linked recessive',
          "Down's syndrome: trisomy of chromosome 21",
        ],
      },
      {
        l: 'Molecular Basis of Inheritance',
        link: 'Molecular Basis of Inheritance',
        c: [
          'DNA double helix proposed by Watson and Crick in 1953',
          'Replication is semi-conservative (Meselson and Stahl)',
          'Central dogma: DNA → RNA → protein',
          'The lac operon regulates genes in E. coli',
          'The human genome has about 3 × 10⁹ base pairs',
          'DNA fingerprinting uses repetitive DNA (VNTRs)',
        ],
      },
      {
        l: 'Evolution',
        link: 'Evolution',
        c: [
          "Darwin's theory: natural selection",
          'Hardy–Weinberg principle: allele frequencies stay constant without evolutionary forces',
          'Homologous organs: divergent evolution; analogous organs: convergent evolution',
          'Industrial melanism in peppered moths shows natural selection',
          'Miller–Urey experiment formed amino acids from simple gases',
        ],
      },
    ],
  },
  {
    exam: C12,
    subject: 'biology',
    chapter: 'Ecology and Environment',
    nodes: [
      {
        l: 'Organisms and Populations',
        link: 'Organisms and Populations',
        c: ['Population attributes: birth rate, death rate, sex ratio, age pyramid', 'Exponential growth: dN/dt = rN', { l: 'Logistic growth: dN/dt = rN(K − N)/K', mark: true }, 'Mutualism: lichens (fungus + alga)', "Gause's competitive exclusion principle"],
      },
      {
        l: 'Ecosystems',
        link: 'Ecosystems',
        c: [
          'Energy flow is unidirectional',
          { l: 'About 10% of energy passes to the next trophic level', mark: true },
          'The pyramid of energy is always upright',
          'Net primary productivity = GPP − respiration losses',
          'Decomposition: fragmentation, leaching, catabolism, humification, mineralisation',
        ],
      },
      {
        l: 'Biodiversity and Conservation',
        link: 'Biodiversity and Conservation',
        c: [
          'India has about 8.1% of the world’s recorded species',
          'In situ: national parks, sanctuaries, biosphere reserves, sacred groves',
          'Ex situ: zoos, botanical gardens, seed banks, cryopreservation',
          'The "Evil Quartet": habitat loss, over-exploitation, alien species, co-extinctions',
        ],
      },
    ],
  },

  // ═══════════════════════════ CLASS 12 · MATHEMATICS ═══════════════════════════
  {
    exam: C12,
    subject: 'mathematics',
    chapter: 'Calculus',
    nodes: [
      {
        l: 'Continuity and Differentiability',
        link: 'Limits and Continuity',
        c: ['f is continuous at c if lim x→c f(x) = f(c)', 'Differentiable ⇒ continuous, but not conversely (|x| at 0)', { l: 'Chain rule: d/dx f(g(x)) = f′(g(x))·g′(x)', mark: true }, 'd/dx (eˣ) = eˣ and d/dx (log x) = 1/x'],
      },
      {
        l: 'Applications of Derivatives',
        link: 'Differentiation and Applications',
        c: ['f is increasing where f′(x) > 0', 'Local maximum where f′(c) = 0 and f″(c) < 0', 'Slope of the tangent at (x₀, y₀) is f′(x₀)', 'Rates: dA/dt = (dA/dr)(dr/dt)'],
      },
      {
        l: 'Integrals',
        link: 'Integration',
        c: ['∫xⁿ dx = xⁿ⁺¹/(n + 1) + C, n ≠ −1', '∫(1/x) dx = log|x| + C', 'By parts: ∫u v dx = u∫v dx − ∫(u′∫v dx) dx', { l: 'Fundamental theorem: ∫ₐᵇ f(x) dx = F(b) − F(a)', mark: true }, '∫₀ᵃ f(x) dx = ∫₀ᵃ f(a − x) dx'],
      },
      { l: 'Application of Integrals', link: 'Integration and Applications', c: ['Area under y = f(x) from a to b = ∫ₐᵇ y dx', 'Area between curves = ∫(upper − lower) dx'] },
      {
        l: 'Differential Equations',
        link: 'Differential Equations',
        c: ['Order: highest derivative; degree: its power', 'Variable separable: g(y) dy = f(x) dx', { l: 'Linear: dy/dx + Py = Q, integrating factor e^∫P dx', mark: true }, 'Homogeneous equations: put y = vx'],
      },
    ],
  },
  {
    exam: C12,
    subject: 'mathematics',
    chapter: 'Algebra',
    nodes: [
      {
        l: 'Relations and Functions',
        c: [
          'Equivalence relation: reflexive, symmetric and transitive',
          'One-one: f(x₁) = f(x₂) ⇒ x₁ = x₂',
          'Onto: every element of the codomain has a pre-image',
          'A function is invertible if it is one-one and onto',
          'A set with n elements has 2^(n²) relations',
        ],
      },
      {
        l: 'Matrices',
        link: 'Matrices',
        c: ['An m × n matrix has m rows and n columns', 'Matrix multiplication is not commutative in general', "(AB)′ = B′A′", "Symmetric: A′ = A; skew-symmetric: A′ = −A", 'Every square matrix = symmetric part + skew-symmetric part'],
      },
      {
        l: 'Determinants',
        link: 'Matrices and Determinants',
        c: ['|AB| = |A||B|', { l: 'A is invertible if and only if |A| ≠ 0', mark: true }, 'A⁻¹ = adj(A) / |A|', 'Area of a triangle = ½ |det of vertex coordinates|', 'Matrix method: AX = B ⇒ X = A⁻¹B', '|kA| = kⁿ|A| for an n × n matrix'],
      },
    ],
  },

  // ═══════════════════════════ CLASS 12 · ENGLISH ═══════════════════════════
  {
    exam: C12,
    subject: 'english',
    chapter: 'Writing Skills',
    nodes: [
      { l: 'Notice', c: ['Format: institution, NOTICE, date, heading, body, name and designation', 'About 50 words, inside a box'] },
      { l: 'Invitation and Reply', c: ['Formal invitations are written in the third person', 'A reply accepts or declines politely, with a reason when declining'] },
      { l: 'Formal Letters', c: ['Letter to the editor, and job application with a résumé', 'Block format with a subject line'] },
      {
        l: 'Article and Report',
        c: ['Article: title, byline, introduction, body, conclusion', 'Report: heading, byline, place and date; written in the past tense', { l: 'About 120–150 words each', tags: ['Important'] }],
      },
    ],
  },
  {
    exam: C12,
    subject: 'english',
    chapter: 'Reading Comprehension',
    nodes: [
      { l: 'Unseen Passage', c: ['Read the questions first, then skim the passage', 'Answer in your own words unless asked to quote', 'Vocabulary questions test meaning in context'] },
      { l: 'Case-based Factual Passage', c: ['Includes data, charts or factual information', 'Questions test inference and interpretation'] },
      { l: 'Exam Strategy', c: ['Questions usually follow the order of the passage', 'Keep short answers within the word limit', 'Underline key words while reading'] },
    ],
  },

  // ═══════════════════════════ CLASS 12 · ECONOMICS ═══════════════════════════
  {
    exam: C12,
    subject: 'economics',
    chapter: 'Introductory Macroeconomics',
    nodes: [
      {
        l: 'National Income',
        c: ['GDP at market price = GDP at factor cost + net indirect taxes', 'NNP at factor cost is called National Income', 'Three methods: value added, income and expenditure', 'Real GDP is measured at constant (base-year) prices'],
      },
      {
        l: 'Money and Banking',
        c: ['Functions of money: medium of exchange, unit of account, store of value', 'The RBI is India’s central bank', 'Monetary tools: repo rate, reverse repo, CRR, SLR, open market operations', 'Money multiplier = 1 / legal reserve ratio'],
      },
      { l: 'Income Determination', c: ['Aggregate demand = C + I in a two-sector economy', { l: 'MPC + MPS = 1', mark: true }, { l: 'Investment multiplier k = 1/(1 − MPC)', mark: true }, 'Equilibrium where planned saving = planned investment'] },
      {
        l: 'Government Budget',
        c: ['Fiscal deficit = total expenditure − (revenue receipts + non-debt capital receipts)', 'Revenue deficit = revenue expenditure − revenue receipts', 'Primary deficit = fiscal deficit − interest payments'],
      },
      { l: 'Balance of Payments', c: ['Current account: goods, services and transfers', 'Capital account: assets such as FDI and loans', 'A flexible exchange rate is set by demand and supply of foreign exchange'] },
    ],
  },
  {
    exam: C12,
    subject: 'economics',
    chapter: 'Indian Economic Development',
    nodes: [
      { l: 'Economy on the Eve of Independence', c: ['Agriculture was stagnant under colonial rule', 'Railways were introduced in India in 1850'] },
      { l: 'Indian Economy 1950–1990', c: ['Five Year Plans began in 1951', 'Plan goals: growth, modernisation, self-reliance and equity', 'The Green Revolution used high-yielding variety (HYV) seeds'] },
      { l: 'Liberalisation, Privatisation and Globalisation', c: [{ l: 'The New Economic Policy was announced in 1991', mark: true }, 'Disinvestment sells part of the government’s share in public sector units', 'The WTO was founded in 1995, replacing GATT'] },
      { l: 'Human Capital and Rural Development', c: ['Education and health raise productivity', 'NABARD was set up in 1982 for rural credit', 'Diversification into animal husbandry, fisheries and horticulture'] },
      { l: 'Sustainable Development', c: ['Meets present needs without compromising future generations (Brundtland Commission)', 'Use renewable energy and reduce pollution'] },
    ],
  },

  // ═══════════════════════════ CLASS 12 · COMPUTER SCIENCE ═══════════════════════════
  {
    exam: C12,
    subject: 'computer-science',
    chapter: 'Programming in Python',
    nodes: [
      { l: 'Data Types', c: ['Mutable: list, dictionary, set', 'Immutable: int, float, str, tuple', 'type() returns the type of a value'] },
      { l: 'Functions', c: ['Defined with def; return sends a value back', 'Default parameters must come after non-default ones', 'Local variables live inside the function; global declares a global one'] },
      { l: 'Exception Handling', c: ['try holds code that may fail', 'except handles the error; finally always runs', 'raise throws an exception'] },
      {
        l: 'File Handling',
        c: [
          'open(file, mode) — modes r, w, a, rb, wb',
          { l: 'with open(...) closes the file automatically', mark: true },
          'Text files: read(), readline(), readlines(), write()',
          'Binary files: pickle.dump() and pickle.load()',
          'CSV files: csv.reader() and csv.writer()',
        ],
      },
      { l: 'Stack', c: [{ l: 'LIFO: last in, first out', mark: true }, 'Push adds to the top; pop removes the top', 'Implemented with a list using append() and pop()'] },
    ],
  },
  {
    exam: C12,
    subject: 'computer-science',
    chapter: 'Database Management',
    nodes: [
      {
        l: 'Database Concepts',
        c: ['Relation = table; tuple = row; attribute = column', 'Degree = number of attributes; cardinality = number of tuples', { l: 'A primary key uniquely identifies each row', mark: true }, 'A foreign key refers to the primary key of another table'],
      },
      {
        l: 'SQL Commands',
        c: ['DDL: CREATE, ALTER, DROP', 'DML: INSERT, UPDATE, DELETE, SELECT', 'WHERE filters rows; ORDER BY sorts; GROUP BY groups', 'Aggregates: COUNT, SUM, AVG, MIN, MAX', 'HAVING filters groups after GROUP BY'],
      },
      { l: 'Joins', c: ['Cartesian product pairs every row of two tables', 'Equi-join matches rows on equal column values', 'Natural join drops the duplicate common column'] },
      { l: 'Python–MySQL Connectivity', c: ['mysql.connector.connect() opens a connection', 'cursor.execute() runs a query; fetchall() reads rows', 'commit() saves INSERT, UPDATE and DELETE changes'] },
    ],
  },

  // ═══════════════════════════ CLASS 12 · BUSINESS STUDIES ═══════════════════════════
  {
    exam: C12,
    subject: 'business-studies',
    chapter: 'Principles and Functions of Management',
    nodes: [
      { l: 'Nature of Management', c: ['Getting things done effectively and efficiently', 'Levels: top, middle and supervisory', { l: 'Coordination is the essence of management', mark: true }] },
      {
        l: 'Principles of Management',
        c: [
          'Fayol gave 14 principles of management',
          'Unity of command: one boss for each employee',
          'Scalar chain: formal line of authority; gang plank for quick communication',
          "Taylor's scientific management: science, not rule of thumb",
          'Functional foremanship: eight specialists supervise workers',
        ],
      },
      { l: 'Planning', c: ['Planning is the primary function of management', 'Types of plans: objective, strategy, policy, procedure, method, rule, budget, programme'] },
      { l: 'Organising', c: ['Functional and divisional structures', 'Delegation transfers authority, not accountability', 'Decentralisation spreads decision-making to lower levels'] },
      { l: 'Staffing, Directing and Controlling', c: ['Staffing: recruitment, selection and training', "Maslow's need hierarchy has five levels", 'Controlling compares actual performance with standards'] },
    ],
  },
  {
    exam: C12,
    subject: 'business-studies',
    chapter: 'Marketing and Consumer Protection',
    nodes: [
      { l: 'Marketing Mix', c: [{ l: 'Four Ps: product, price, place, promotion', mark: true }, 'Branding, labelling and packaging are product decisions', 'Promotion mix: advertising, personal selling, sales promotion, public relations'] },
      { l: 'Marketing Philosophies', c: ['Production, product, selling, marketing and societal marketing concepts'] },
      {
        l: 'Consumer Protection Act, 2019',
        c: [
          'Rights: safety, information, choice, to be heard, to seek redressal, consumer education',
          { l: 'Redressal agencies', h: true },
          { l: 'District Commission: claims up to ₹1 crore', dash: true },
          { l: 'State Commission: above ₹1 crore up to ₹10 crore', dash: true },
          { l: 'National Commission: above ₹10 crore', dash: true },
        ],
      },
    ],
  },
];
