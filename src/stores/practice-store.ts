import { create } from 'zustand';

export interface PracticeStats {
  correct: number;
  incorrect: number;
  skipped: number;
  streak: number;
  bestStreak: number;
  sessionAccuracy: number;
  xp: number;
  lastXpGained: number;
  combo: number; // current combo multiplier tier: 1, 2, or 3
}

interface PracticeStore {
  stats: PracticeStats;
  recordAnswer: (isCorrect: boolean) => void;
  resetSession: () => void;
}

const DEFAULT_STATS: PracticeStats = {
  correct: 0,
  incorrect: 0,
  skipped: 0,
  streak: 0,
  bestStreak: 0,
  sessionAccuracy: 0,
  xp: 0,
  lastXpGained: 0,
  combo: 1,
};

/** Returns combo tier (1/2/3) and XP for the next correct answer */
export function getComboInfo(streak: number): { tier: number; label: string; xp: number } {
  if (streak >= 10) return { tier: 3, label: '3× BLAZING', xp: 30 };
  if (streak >= 5)  return { tier: 2, label: '2× ON FIRE', xp: 20 };
  if (streak >= 3)  return { tier: 1, label: '1.5× HOT', xp: 15 };
  return { tier: 0, label: '', xp: 10 };
}

export const usePracticeStore = create<PracticeStore>((set) => ({
  stats: DEFAULT_STATS,

  recordAnswer: (isCorrect: boolean) =>
    set((state) => {
      const correct   = state.stats.correct + (isCorrect ? 1 : 0);
      const incorrect = state.stats.incorrect + (isCorrect ? 0 : 1);
      const streak    = isCorrect ? state.stats.streak + 1 : 0;
      const bestStreak = Math.max(state.stats.bestStreak, streak);
      const total = correct + incorrect;
      const sessionAccuracy = total > 0 ? (correct / total) * 100 : 0;

      const { tier, xp: xpGained } = getComboInfo(isCorrect ? streak : 0);
      const xp = state.stats.xp + (isCorrect ? xpGained : 0);
      const combo = tier;

      return {
        stats: {
          ...state.stats,
          correct, incorrect, streak, bestStreak,
          sessionAccuracy, xp,
          lastXpGained: isCorrect ? xpGained : 0,
          combo,
        },
      };
    }),

  resetSession: () => set({ stats: DEFAULT_STATS }),
}));
