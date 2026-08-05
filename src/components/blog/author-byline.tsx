import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

export function AuthorByline({
  name,
  imageUrl,
  updatedAt,
}: {
  name: string;
  imageUrl?: string;
  updatedAt: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9">
        {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="text-sm leading-tight">
        <p className="font-medium text-foreground">{name}</p>
        <p className="text-muted-foreground">
          Updated{' '}
          {new Date(updatedAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
