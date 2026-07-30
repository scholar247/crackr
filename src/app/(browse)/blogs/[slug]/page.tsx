import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { serverGet } from '@/lib/server-fetch';
import { Badge } from '@/components/ui/badge';
import type { BlogClient } from '@/types';
import { Clock, Eye, Calendar, ChevronRight } from 'lucide-react';
import Script from 'next/script';
import { BlogContent } from './blog-content';

interface Props {
  params: Promise<{ slug: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://scholar247.org';

const TYPE_LABELS: Record<string, string> = {
  THEORY: 'Theory',
  QUICK_LEARN: 'Quick Learn',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await serverGet<{ blog: BlogClient }>(`/api/public/blogs/${slug}`);
    const blog = data.blog;
    const seo = blog.seo ?? {};
    const title = seo.metaTitle ?? blog.title;
    const description = seo.metaDescription ?? blog.summary;
    return {
      title,
      description,
      keywords: seo.keywords,
      robots: seo.robots ?? 'index,follow',
      alternates: { canonical: seo.canonicalUrl ?? `${BASE_URL}/blogs/${blog.slug}` },
      openGraph: {
        title: seo.ogTitle ?? title,
        description: seo.ogDescription ?? description,
        images: seo.ogImage ? [{ url: seo.ogImage }] : blog.featuredImage ? [{ url: blog.featuredImage }] : [],
        type: 'article',
        publishedTime: blog.publishedAt,
        modifiedTime: blog.updatedAt,
      },
      twitter: {
        card: 'summary_large_image',
        title: seo.twitterTitle ?? title,
        description: seo.twitterDescription ?? description,
        images: seo.twitterImage ? [seo.twitterImage] : [],
      },
    };
  } catch {
    return { title: 'Blog Not Found' };
  }
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;

  let blog: BlogClient;
  let related: BlogClient[] = [];

  try {
    const data = await serverGet<{ blog: BlogClient; related: BlogClient[] }>(`/api/public/blogs/${slug}`);
    blog = data.blog;
    related = data.related ?? [];
  } catch {
    notFound();
  }

  const seo = blog.seo ?? {};
  const schemaType = seo.schemaType ?? 'Article';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    headline: blog.title,
    description: seo.metaDescription ?? blog.summary,
    image: blog.featuredImage ?? seo.ogImage,
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt,
    author: { '@type': 'Organization', name: 'Scholar247' },
    publisher: {
      '@type': 'Organization',
      name: 'Scholar247',
      url: BASE_URL,
    },
    url: `${BASE_URL}/blogs/${blog.slug}`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/blogs/${blog.slug}` },
  };

  return (
    <>
      <Script
        id="blog-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link href="/blogs" className="hover:text-foreground transition-colors">Blogs</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium line-clamp-1">{blog.title}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 space-y-4">
          <Badge variant="outline" className="text-xs">
            {TYPE_LABELS[blog.type] ?? blog.type}
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight leading-tight">{blog.title}</h1>

          {blog.summary && (
            <p className="text-lg text-muted-foreground">{blog.summary}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {blog.readingTimeMinutes} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {blog.viewCount.toLocaleString()} views
            </span>
            {blog.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(blog.publishedAt).toLocaleDateString('en-IN', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        {/* Featured image */}
        {blog.featuredImage && (
          <div className="mb-8 rounded-xl overflow-hidden aspect-video">
            <img
              src={blog.featuredImage}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Body */}
        {blog.content ? (
          <BlogContent content={blog.content} />
        ) : (
          <p className="text-muted-foreground italic">No content yet.</p>
        )}

        {/* Related blogs */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-lg font-semibold mb-4">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/blogs/${r.slug}`}
                  className="group rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all p-4 space-y-1.5"
                >
                  <Badge variant="outline" className="text-xs">
                    {TYPE_LABELS[r.type] ?? r.type}
                  </Badge>
                  <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {r.title}
                  </h3>
                  {r.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{r.summary}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {r.readingTimeMinutes}m
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
