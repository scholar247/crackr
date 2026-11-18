// A short CSS-only confetti burst for quiz milestones — no dependency, no canvas. Pieces
// fly out from the centre (positions are deterministic, so render is pure) and fade;
// hidden entirely for reduced-motion users (motion-safe).

const COLOURS = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-violet-500', 'bg-teal-500', 'bg-pink-500', 'bg-yellow-400'];
const PIECES = Array.from({ length: 36 }, (_, i) => {
  const angle = (i / 36) * Math.PI * 2 + (i % 3) * 0.17;
  const distance = 120 + ((i * 37) % 110);
  return {
    dx: Math.round(Math.cos(angle) * distance),
    dy: Math.round(Math.sin(angle) * distance - 40),
    rotate: (i * 47) % 360,
    delay: (i % 6) * 25,
    colour: COLOURS[i % COLOURS.length],
    wide: i % 4 === 0,
  };
});

export function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] hidden items-center justify-center motion-safe:flex">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className={`mm-confetti absolute block rounded-sm ${p.colour} ${p.wide ? 'h-1.5 w-3' : 'h-2.5 w-1.5'}`}
          style={{ ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px`, ['--rot' as string]: `${p.rotate}deg`, animationDelay: `${p.delay}ms` }}
        />
      ))}
    </div>
  );
}
