'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BLOG_SORT_OPTIONS } from '@/lib/blog-list-params';
import type { BlogListSort } from '@/server/repositories/article.repository';

// Changing the sort goes back to page 1 (page 4 of "latest" means nothing under "oldest").
export function BlogSortSelect({ value }: { value: BlogListSort }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (next: string) => {
    const qs = new URLSearchParams(searchParams.toString());
    qs.delete('page');
    if (next === 'latest') qs.delete('sort');
    else qs.set('sort', next);
    const s = qs.toString();
    router.push(s ? `${pathname}?${s}` : pathname);
  };

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-44" aria-label="Sort blogs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {BLOG_SORT_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
