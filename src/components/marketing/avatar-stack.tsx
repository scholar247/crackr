const AVATAR_TINTS = ['bg-primary/20 text-primary', 'bg-secondary/20 text-secondary', 'bg-tertiary/20 text-tertiary'];

export function AvatarStack({ label = 'Aspirants joined this week' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {AVATAR_TINTS.map((tint, i) => (
          <div
            key={i}
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-[11px] font-semibold ${tint}`}
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground">
          +12k
        </div>
      </div>
      <span className="text-body-sm text-muted-foreground">{label}</span>
    </div>
  );
}
