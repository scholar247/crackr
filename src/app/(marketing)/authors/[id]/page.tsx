import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { userRepository } from '@/server/repositories/user.repository';
import { articleRepository } from '@/server/repositories/article.repository';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { calcReadingTime } from '@/lib/reading-time';

export const dynamic = 'force-dynamic';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

// Same hand-picked field set as GET /api/v1/public/authors/[id] — this page fetches the
// repository directly (server-side, per this codebase's convention) but must stay
// equally careful not to select or render email/role/status.
async function getPublicAuthor(id: string) {
  const user = await userRepository.findById(id);
  if (!user) return null;
  return { id: user.id, name: user.name, image: user.image, college: user.college, degree: user.degree };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const author = await getPublicAuthor(id);
  if (!author) return {};
  return { title: author.name ?? 'Author' };
}

export default async function AuthorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await getPublicAuthor(id);
  if (!author) notFound();

  const articles = await articleRepository.findPublishedByAuthor(id, 12);
  const name = author.name ?? 'Scholar';

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
        <Avatar className="h-20 w-20">
          {author.image && <AvatarImage src={author.image} alt={name} />}
          <AvatarFallback className="text-xl">{initials(name)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{name}</h1>
          {(author.degree || author.college) && (
            <p className="mt-1 text-sm text-muted-foreground">
              {[author.degree, author.college].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-foreground">Articles by {name}</h2>
        {articles.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No published articles yet.</p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/blogs/${article.slug}`}
                className="overflow-hidden rounded-xl border border-border transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                {article.ogImage && (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, matches blogs listing precedent
                  <img src={article.ogImage} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                )}
                <div className="p-5">
                  <h3 className="font-semibold text-foreground">{article.title}</h3>
                  {article.summary && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.summary}</p>}
                  <p className="mt-3 text-xs text-muted-foreground">{calcReadingTime(article.body)} min read</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
