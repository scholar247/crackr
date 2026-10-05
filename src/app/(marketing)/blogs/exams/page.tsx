import { redirect } from 'next/navigation';

// `/blogs/exams` has no page of its own — the exam list is the sidebar on /blogs.
export default function BlogsExamsIndexPage() {
  redirect('/blogs');
}
