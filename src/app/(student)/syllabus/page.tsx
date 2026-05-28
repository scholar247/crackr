import { SyllabusClient } from './syllabus-client';

export default function SyllabusPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Syllabus Tracker</h1>
        <p className="text-muted-foreground mt-1">
          Track your progress across the exam syllabus.
        </p>
      </div>
      <SyllabusClient />
    </div>
  );
}
