// Deterministic branch colours: a main topic's colour comes from its position in the map
// (branch index), and every descendant uses a lighter shade of the same colour. Classes are
// written out in full so Tailwind generates them; each pair is checked for contrast in both
// themes (dark text on light tints, light text on dark tints).

export interface BranchColour {
  topic: string; // main-topic node
  sub: string; // deeper nodes
  stroke: string; // connecting line
  dot: string; // small swatches
  ring: string; // selection ring
}

export const BRANCH_COLOURS: BranchColour[] = [
  {
    topic: 'border-blue-500 bg-blue-50 text-blue-950 dark:bg-blue-950/70 dark:text-blue-50',
    sub: 'border-blue-300 bg-background text-foreground dark:border-blue-500/50',
    stroke: 'stroke-blue-500',
    dot: 'bg-blue-500',
    ring: 'ring-blue-500',
  },
  {
    topic: 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-50',
    sub: 'border-emerald-300 bg-background text-foreground dark:border-emerald-500/50',
    stroke: 'stroke-emerald-500',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500',
  },
  {
    topic: 'border-orange-500 bg-orange-50 text-orange-950 dark:bg-orange-950/70 dark:text-orange-50',
    sub: 'border-orange-300 bg-background text-foreground dark:border-orange-500/50',
    stroke: 'stroke-orange-500',
    dot: 'bg-orange-500',
    ring: 'ring-orange-500',
  },
  {
    topic: 'border-violet-500 bg-violet-50 text-violet-950 dark:bg-violet-950/70 dark:text-violet-50',
    sub: 'border-violet-300 bg-background text-foreground dark:border-violet-500/50',
    stroke: 'stroke-violet-500',
    dot: 'bg-violet-500',
    ring: 'ring-violet-500',
  },
  {
    topic: 'border-teal-500 bg-teal-50 text-teal-950 dark:bg-teal-950/70 dark:text-teal-50',
    sub: 'border-teal-300 bg-background text-foreground dark:border-teal-500/50',
    stroke: 'stroke-teal-500',
    dot: 'bg-teal-500',
    ring: 'ring-teal-500',
  },
  {
    topic: 'border-pink-500 bg-pink-50 text-pink-950 dark:bg-pink-950/70 dark:text-pink-50',
    sub: 'border-pink-300 bg-background text-foreground dark:border-pink-500/50',
    stroke: 'stroke-pink-500',
    dot: 'bg-pink-500',
    ring: 'ring-pink-500',
  },
];

export const colourFor = (branch: number) => BRANCH_COLOURS[branch % BRANCH_COLOURS.length];

export const CENTRE_CLASSES = 'border-indigo-950 bg-indigo-900 text-white dark:border-indigo-400 dark:bg-indigo-700';

/**
 * Classic (print) theme: monochrome on white paper, in light and dark mode alike — black
 * text, dark borders on main topics, grey connectors. Prints and photocopies cleanly.
 */
export const CLASSIC_COLOUR: BranchColour = {
  topic: 'border-neutral-800 bg-white text-neutral-950',
  sub: 'border-neutral-400 bg-white text-neutral-900',
  stroke: 'stroke-neutral-500',
  dot: 'bg-neutral-500',
  ring: 'ring-neutral-900',
};
export const CLASSIC_CENTRE_CLASSES = 'border-neutral-300 bg-gradient-to-b from-[#f2f2f2] to-[#d9d9d9] text-neutral-950 shadow-xl';
