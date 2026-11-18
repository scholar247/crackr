import {
  Atom,
  BookOpen,
  Briefcase,
  Calculator,
  Code2,
  Dna,
  Dumbbell,
  FileText,
  FlaskConical,
  Globe2,
  Landmark,
  Languages,
  Music,
  Palette,
  Scale,
  Sigma,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

// Subject → icon by keyword, so new subjects typed in the admin panel get a sensible icon
// without a lookup table to maintain. First match wins; order specific → generic.
const ICONS: [RegExp, LucideIcon][] = [
  [/physic(s|al science)/, Atom],
  [/chemi/, FlaskConical],
  [/bio|life science/, Dna],
  [/physical education|sport|yoga/, Dumbbell],
  [/math|statistic/, Sigma],
  [/account/, Calculator],
  [/econom/, TrendingUp],
  [/business|commerce|entrepreneur/, Briefcase],
  [/computer|informatic|\bit\b|artificial|coding|data/, Code2],
  [/politic|legal|law/, Scale],
  [/geograph/, Globe2],
  [/histor|social|civics|sociolog/, Landmark],
  [/science/, FlaskConical],
  // Before the generic language rule: "English Language and Literature" is English.
  [/english|literature/, BookOpen],
  [/hindi|sanskrit|urdu|punjabi|bengali|tamil|telugu|marathi|french|german|spanish|language/, Languages],
  [/music|dance/, Music],
  [/art|painting|design/, Palette],
];

export function subjectIcon(subject: string): LucideIcon {
  const s = subject.toLowerCase();
  return ICONS.find(([re]) => re.test(s))?.[1] ?? FileText;
}

// Theme tones only (never raw colours), so cards follow light/dark mode. Picked from the
// slug so a subject keeps the same tone on every page.
const TONES = [
  'bg-primary/10 text-primary ring-primary/20',
  'bg-secondary/10 text-secondary ring-secondary/20',
  'bg-tertiary/10 text-tertiary ring-tertiary/20',
] as const;

export function subjectTone(slug: string): string {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}
