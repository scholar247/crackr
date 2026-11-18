import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/site-config';

// Social preview card (1200×630) for a chapter mind map: the chapter title plus a small
// drawing of its main topics around the centre — so a link shared on WhatsApp, X or
// Telegram shows what's inside instead of a generic logo. Inputs come from the page's own
// metadata via the query string; they are clipped and only ever rendered as text.

const COLOURS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#14b8a6', '#ec4899'];
const W = 1200;
const H = 630;

const clip = (s: string | null, max: number) => {
  const v = (s ?? '').trim();
  return v.length > max ? `${v.slice(0, max - 1)}…` : v;
};

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  // kind=exam: the exam home page card (subjects around the board name).
  const exam = q.get('kind') === 'exam';
  const chapter = clip(q.get('chapter'), 70) || 'Mind map';
  const subject = clip(q.get('subject'), 40);
  const eyebrow = clip(q.get('eyebrow'), 40);
  const topics = (q.get('topics') ?? '')
    .split('|')
    .map((t) => clip(t, 28))
    .filter(Boolean)
    .slice(0, 6);

  // Mini map on the right: centre card with topics alternating right / left.
  const cx = 850;
  const cy = 330;
  const right = topics.filter((_, i) => i % 2 === 0);
  const left = topics.filter((_, i) => i % 2 === 1);
  const rows = (list: string[]) => list.map((label, i) => ({ label, y: cy + (i - (list.length - 1) / 2) * 96 }));
  const pills = [
    ...rows(right).map((p, i) => ({ ...p, side: 1 as const, colour: COLOURS[(i * 2) % COLOURS.length] })),
    ...rows(left).map((p, i) => ({ ...p, side: -1 as const, colour: COLOURS[(i * 2 + 1) % COLOURS.length] })),
  ];
  const pillW = 168;
  const pillH = 52;
  const centreW = 168;
  const centreH = 76;
  const pillX = (side: 1 | -1) => (side === 1 ? cx + centreW / 2 + 48 : cx - centreW / 2 - 48 - pillW);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)', fontFamily: 'sans-serif', position: 'relative' }}>
        {/* Left: title */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 560, padding: '64px 0 56px 64px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#4f46e5', letterSpacing: 2, textTransform: 'uppercase' }}>{[eyebrow, subject].filter(Boolean).join(' · ')}</div>
            <div style={{ marginTop: 18, fontSize: chapter.length > 32 ? 52 : 64, fontWeight: 800, color: '#111827', lineHeight: 1.08 }}>{chapter}</div>
            <div style={{ marginTop: 18, fontSize: 30, color: '#374151' }}>{exam ? 'Board Exam Preparation' : 'Mind Map'}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              {(exam ? ['Mind maps', 'MCQs', 'Sample papers'] : ['Interactive', 'Quiz me', 'Flashcards']).map((t) => (
                <div key={t} style={{ display: 'flex', padding: '8px 16px', borderRadius: 999, background: '#e0e7ff', color: '#3730a3', fontSize: 20, fontWeight: 600 }}>
                  {t}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 26, fontSize: 30, fontWeight: 800, color: '#111827' }}>{SITE_NAME}</div>
          </div>
        </div>

        {/* Right: mini mind map */}
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
          {pills.map((p, i) => {
            const x1 = cx + (p.side * centreW) / 2;
            const x2 = p.side === 1 ? pillX(1) : pillX(-1) + pillW;
            const mid = (x1 + x2) / 2;
            return <path key={i} d={`M ${x1} ${cy} C ${mid} ${cy}, ${mid} ${p.y}, ${x2} ${p.y}`} stroke={p.colour} strokeWidth={4} fill="none" />;
          })}
        </svg>
        {pills.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: pillX(p.side),
              top: p.y - pillH / 2,
              width: pillW,
              height: pillH,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: '0 14px',
              borderRadius: 14,
              border: `3px solid ${p.colour}`,
              background: '#ffffff',
              color: '#111827',
              fontSize: p.label.length > 12 ? 17 : 20,
              fontWeight: 600,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {p.label}
          </div>
        ))}
        <div
          style={{
            position: 'absolute',
            left: cx - centreW / 2,
            top: cy - centreH / 2,
            width: centreW,
            height: centreH,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0 12px',
            borderRadius: 18,
            background: '#312e81',
            color: '#ffffff',
            fontSize: chapter.length > 18 ? 18 : 22,
            fontWeight: 800,
            lineHeight: 1.15,
          }}
        >
          {clip(chapter, 36)}
        </div>
      </div>
    ),
    { width: W, height: H, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400' } },
  );
}
