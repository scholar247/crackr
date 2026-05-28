import { Badge } from '@/components/ui/badge';
import { DIFFICULTY_COLORS } from '@/lib/utils';
import type { Difficulty } from '@/types';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

const LABELS: Record<Difficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
  EXPERT: 'Expert',
};

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`${DIFFICULTY_COLORS[difficulty]} border-transparent ${className}`}
    >
      {LABELS[difficulty]}
    </Badge>
  );
}
