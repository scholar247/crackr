import { Metadata } from 'next';
import { CategoriesClient } from './categories-client';

export const metadata: Metadata = { title: 'Categories | Admin' };

export default function AdminCategoriesPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-muted-foreground mt-1">Organise MCQs into categories per subject</p>
      </div>
      <CategoriesClient />
    </div>
  );
}
