import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import type { SubjectClient } from '@/types';

interface SubjectBadgeProps {
  subject: SubjectClient;
  className?: string;
  showIcon?: boolean;
}

export function SubjectBadge({ subject, className, showIcon = true }: SubjectBadgeProps) {
  // Dynamic Lucide icon lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[subject.iconName] as React.ElementType | undefined;

  return (
    <Badge
      variant="outline"
      className={`border-transparent ${className}`}
      style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
    >
      {showIcon && Icon && <Icon className="h-3 w-3" />}
      {subject.name}
    </Badge>
  );
}
