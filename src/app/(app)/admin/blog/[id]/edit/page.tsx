import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { meetsMinRole, isAdmin } from '@/lib/roles';
import { articleRepository } from '@/server/repositories/article.repository';
import { BlogForm } from '@/components/editor/blog-form';
import { parseContentId } from '@/lib/utils';

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !meetsMinRole(session.user.role, 'TEACHER')) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const articleId = parseContentId(id);
  if (articleId === null) notFound();

  const article = await articleRepository.findById(articleId);
  if (!article) notFound();
  if (!isAdmin(session.user.role) && article.authorId !== session.user.id) {
    redirect('/admin/blog');
  }

  const node = await articleRepository.findNodeForArticle(article.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Edit article</h1>
      <div className="mt-6">
        <BlogForm
          mode="edit"
          initial={{
            id: article.id,
            title: article.title,
            slug: article.slug,
            summary: article.summary,
            body: article.body,
            status: article.status,
            visibility: article.visibility,
            articleType: article.articleType,
            isFeatured: article.isFeatured,
            metaTitle: article.metaTitle,
            metaDescription: article.metaDescription,
            keywords: article.keywords,
            ogImage: article.ogImage,
            nodeId: node?.nodeId,
            updatedAt: article.updatedAt.toISOString(),
          }}
        />
      </div>
    </div>
  );
}
