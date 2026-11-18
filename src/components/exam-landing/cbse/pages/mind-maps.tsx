import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, FileQuestion, History, Network, Target } from 'lucide-react';
import type { Metadata } from 'next';
import type { ExamSubpage } from '@/components/exam-landing/registry';
import { PageSection } from '@/components/exam-landing/shared/exam-page-shell';
import { EmptyState } from '@/components/exam-landing/shared/empty-state';
import { JsonLd } from '@/components/exam-landing/shared/json-ld';
import { MindMap } from '@/components/mind-map/mind-map';
import { MindMapIndex, type IndexSubject } from '@/components/mind-map/mind-map-index';
import { MindMapMarkdown } from '@/components/mind-map/markdown';
import { RevisionChecklist } from '@/components/mind-map/revision-checklist';
import { colourFor } from '@/components/mind-map/palette';
import { cn } from '@/lib/utils';
import { MIND_MAP_ANCHOR, countNodes, mindMapsPath, type MindMapFaq, type MindMapTreeNode } from '@/lib/mind-maps';
import { loadChapterMindMap, loadMindMapIndex, type ChapterMindMap, type MindMapIndex as Index, type NodeResources } from '@/server/services/mind-maps';
import type { CbseBoard } from '@/content/exams/cbse/types';
import { CbsePageShell } from '../page-shell';
import { cbsePath } from '../paths';
import { absoluteUrl, cbseMeta, ORGANIZATION, collectionPageJsonLd } from '../seo';

// CBSE chapter mind maps: /exams/{slug}/mind-maps[/{subject}[/{chapter}]]. Only published
// maps are listed or rendered; everything shown is either curriculum data (chapter, topic
// and subtopic names), live counts, or editor-written text that went through the publish
// workflow — nothing is generated beyond restating those names.

const listFormat = new Intl.ListFormat('en-IN', { style: 'long', type: 'conjunction' });
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

function indexSubjects(board: CbseBoard, index: Index): IndexSubject[] {
  return index
    .filter((s) => s.chapters.length > 0)
    .map((s) => ({
      id: s.subject.id,
      name: board.shortSubjectName(s.subject.name),
      href: mindMapsPath(board.examSlug, s.subject.slug),
      totalChapters: s.totalChapters,
      chapters: s.chapters.map((c) => ({ id: c.id, name: c.name, href: mindMapsPath(board.examSlug, s.subject.slug, c.slug), topicCount: c.topicCount, intro: c.intro })),
    }));
}

// ── Hub ────────────────────────────────────────────────────────────────────────

function HubPage({ board, index }: { board: CbseBoard; index: Index }) {
  const c = board.shortLabel;
  const subjects = indexSubjects(board, index);
  const total = subjects.reduce((n, s) => n + s.chapters.length, 0);

  return (
    <CbsePageShell
      board={board}
      current="mind-maps"
      eyebrow={`CBSE · ${c} · Visual revision`}
      title={`${board.label} Mind Maps: Chapter-wise Visual Revision`}
      intro={
        total > 0
          ? `Interactive mind maps for ${total} ${c} chapter${total === 1 ? '' : 's'}. Each one lays out a chapter's topics and subtopics so you can see how they connect — expand any branch, search it, and jump straight to practice questions and notes for that topic.`
          : `Interactive, chapter-wise mind maps for ${c} are being prepared. Each will lay out a chapter's topics and subtopics with links to practice and notes.`
      }
    >
      {total > 0 ? (
        <MindMapIndex subjects={subjects} classLabel={c} analyticsExam={board.examSlug} />
      ) : (
        <EmptyState
          icon={<Network className="h-5 w-5" />}
          title="Mind maps are on the way"
          description={`We're building ${c} mind maps chapter by chapter. Meanwhile, revise with the syllabus and practice questions.`}
          action={
            <Link href={cbsePath(board.examSlug, 'syllabus')} className="text-sm font-semibold text-primary hover:underline">
              Browse the {c} syllabus
            </Link>
          }
        />
      )}
      {total > 0 && (
        <JsonLd
          data={collectionPageJsonLd({
            path: mindMapsPath(board.examSlug),
            name: `${board.label} Mind Maps`,
            description: `Chapter-wise interactive mind maps for ${board.label}.`,
            items: subjects.flatMap((s) => s.chapters.map((ch) => ({ name: `${c} ${s.name}: ${ch.name} mind map`, path: ch.href }))),
          })}
        />
      )}
    </CbsePageShell>
  );
}

// ── Subject ────────────────────────────────────────────────────────────────────

function SubjectPage({ board, entry }: { board: CbseBoard; entry: Index[number] }) {
  const c = board.shortLabel;
  const subject = board.shortSubjectName(entry.subject.name);
  const [indexSubject] = indexSubjects(board, [entry]);
  const pending = entry.totalChapters - entry.chapters.length;

  return (
    <CbsePageShell
      board={board}
      current="mind-maps"
      crumbs={[{ label: subject }]}
      eyebrow={`CBSE · ${c} · ${subject}`}
      title={`${c} ${subject} Mind Maps`}
      intro={`Chapter-wise interactive mind maps for ${board.label} ${subject}: ${listFormat.format(entry.chapters.map((ch) => ch.name).slice(0, 5))}${entry.chapters.length > 5 ? ' and more' : ''}. Open a chapter to explore its topics and subtopics, then practise each one.`}
    >
      <MindMapIndex subjects={[indexSubject]} classLabel={c} analyticsExam={board.examSlug} />
      {pending > 0 && (
        <p className="text-body-sm text-muted-foreground">
          {pending} more {subject} chapter{pending === 1 ? '' : 's'} coming soon.
        </p>
      )}
      <PageSection id="related" title={`More ${c} ${subject} resources`}>
        <ul className="flex flex-wrap gap-2">
          {[
            { href: `${cbsePath(board.examSlug, 'syllabus')}#syllabus-${entry.subject.slug}`, label: `${c} ${subject} syllabus` },
            { href: cbsePath(board.examSlug, 'practice'), label: `${c} ${subject} MCQs` },
            { href: cbsePath(board.examSlug, 'notes'), label: `${c} notes` },
          ].map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40 hover:text-primary">
                {l.label} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </PageSection>
    </CbsePageShell>
  );
}

// ── Chapter ────────────────────────────────────────────────────────────────────

function ResourceLinks({ r, compact }: { r: NodeResources | undefined; compact?: boolean }) {
  if (!r || (r.mcqs === 0 && r.notes === 0)) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-2', compact ? 'mt-1.5' : 'mt-3')}>
      {r.practiceHref && (
        <Link href={r.practiceHref} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/15">
          <Target className="h-3 w-3" aria-hidden /> Practise {r.mcqs} MCQs
        </Link>
      )}
      {r.pyqs > 0 && <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">{r.pyqs} PYQs</span>}
      {r.notesHref && (
        <Link href={r.notesHref} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:border-primary/40 hover:text-primary">
          <BookOpen className="h-3 w-3" aria-hidden /> Notes
        </Link>
      )}
    </div>
  );
}

function SubtopicList({ nodes, resources }: { nodes: MindMapTreeNode[]; resources: Record<string, NodeResources> }) {
  return (
    <ul className="mt-2 space-y-2 border-l border-border pl-4">
      {nodes.map((n) => (
        <li key={n.id}>
          <p className="text-sm font-medium text-foreground">{n.label}</p>
          {n.description && <p className="text-body-sm text-muted-foreground">{n.description}</p>}
          {n.content && (
            <div className="mt-1">
              <MindMapMarkdown markdown={n.content} />
            </div>
          )}
          <ResourceLinks r={resources[n.id]} compact />
          {n.children.length > 0 && <SubtopicList nodes={n.children} resources={resources} />}
        </li>
      ))}
    </ul>
  );
}

function chapterFaqs(board: CbseBoard, data: ChapterMindMap, subject: string): MindMapFaq[] {
  const topics = data.snapshot.nodes.map((n) => n.label);
  const derived: MindMapFaq[] = [
    {
      question: `What topics are covered in the ${board.shortLabel} ${subject} ${data.chapter.name} mind map?`,
      answer: `It covers ${topics.length} main topic${topics.length === 1 ? '' : 's'}: ${listFormat.format(topics)}, with ${data.nodeCount - topics.length} subtopics in total, following the chapter's syllabus structure.`,
    },
    {
      question: 'How do I use this mind map to revise?',
      answer:
        'Start with the main branches to see how the chapter is organised, then expand one topic at a time. Tick each topic in the revision checklist once you can explain it without notes, and practise its questions to check yourself.',
    },
  ];
  return [...data.snapshot.faqs, ...derived];
}

function ChapterPage({ board, data }: { board: CbseBoard; data: ChapterMindMap }) {
  const c = board.shortLabel;
  const subject = board.shortSubjectName(data.subject.name);
  const path = mindMapsPath(board.examSlug, data.subject.slug, data.chapter.slug);
  const { snapshot } = data;
  const topics = snapshot.nodes;
  const title = `${c} ${subject} ${data.chapter.name} Mind Map`;
  const intro =
    snapshot.intro ??
    `This mind map breaks ${data.chapter.name} into ${topics.length} topic${topics.length === 1 ? '' : 's'} — ${listFormat.format(topics.map((t) => t.label))} — with ${data.nodeCount - topics.length} subtopics. Tap a topic to expand it, or search for any term.`;
  const faqs = chapterFaqs(board, data, subject);
  const cr = data.chapterResources;
  const analytics = { exam: board.examSlug, chapter: data.chapter.slug };

  return (
    <CbsePageShell
      board={board}
      current="mind-maps"
      crumbs={[{ label: subject, href: mindMapsPath(board.examSlug, data.subject.slug) }, { label: data.chapter.name }]}
      eyebrow={`CBSE · ${c} · ${subject}`}
      title={title}
      intro={intro}
      compact
    >
      <section id={MIND_MAP_ANCHOR} aria-label={`${data.chapter.name} interactive mind map`} className="scroll-mt-32">
        <MindMap
          title={{ eyebrow: `CBSE ${c}`, subject, chapter: data.chapter.name }}
          nodes={topics}
          resources={data.resources}
          storageKey={`mindmap-explored:${board.examSlug}:${data.chapter.id}`}
          analytics={analytics}
          shareUrl={absoluteUrl(path)}
          focusIndex={data.focusIndex}
          theme={data.snapshot.theme}
          size="tall"
          membersOnly
        />
        <p className="mt-2 text-xs text-muted-foreground">Tap a topic to open it and see its practice questions. Use Quiz me to test your recall.</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <PageSection id="topics" title={`Topics in ${data.chapter.name}`} description="Every branch of the mind map, with its subtopics and where to practise.">
          {/* Blurred while a quiz is running on the map above (it lists the answers). */}
          <div className="space-y-4" data-quiz-conceal>
            {topics.map((t, i) => (
              <article key={t.id} id={`topic-${t.id}`} className="scroll-mt-32 rounded-2xl border border-border bg-card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <span className={cn('h-3 w-3 shrink-0 rounded-full', colourFor(i).dot)} aria-hidden />
                  {t.label}
                  {t.children.length > 0 && <span className="text-xs font-normal text-muted-foreground">· {countNodes(t.children)} subtopics</span>}
                </h3>
                {t.description && <p className="text-body-sm mt-2 text-muted-foreground">{t.description}</p>}
                {t.content && (
                  <div className="mt-3">
                    <MindMapMarkdown markdown={t.content} />
                  </div>
                )}
                <ResourceLinks r={data.resources[t.id]} />
                {t.children.length > 0 && <SubtopicList nodes={t.children} resources={data.resources} />}
              </article>
            ))}
          </div>
        </PageSection>

        <aside className="space-y-4 lg:sticky lg:top-32" aria-label="Revision and practice">
          <RevisionChecklist storageKey={`mindmap-revised:${board.examSlug}:${data.chapter.id}`} topics={topics.map((t) => ({ id: t.id, label: t.label, subtopics: countNodes(t.children) }))} />

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-semibold text-foreground">Practise {data.chapter.name}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <FileQuestion className="h-4 w-4" aria-hidden /> Practice MCQs
                </span>
                {cr.practiceHref ? (
                  <Link href={cr.practiceHref} className="font-semibold text-primary hover:underline">
                    {cr.mcqs} questions
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Coming soon</span>
                )}
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <History className="h-4 w-4" aria-hidden /> Previous year questions
                </span>
                <span className={cr.pyqs > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{cr.pyqs > 0 ? cr.pyqs : 'None tagged yet'}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4" aria-hidden /> Notes
                </span>
                {cr.notesHref ? (
                  <Link href={cr.notesHref} className="font-semibold text-primary hover:underline">
                    {cr.notes} notes
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Coming soon</span>
                )}
              </li>
            </ul>
            <Link href={cr.practiceHref ?? cbsePath(board.examSlug, 'practice')} className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              {cr.practiceHref ? `Practise ${data.chapter.name}` : `Practise ${c} MCQs`} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </aside>
      </div>

      {snapshot.revisionNotes && (
        <PageSection id="quick-revision" title={`${data.chapter.name}: quick revision`} description="Key definitions, formulas and facts to go over before the exam.">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6" data-quiz-conceal>
            <MindMapMarkdown markdown={snapshot.revisionNotes} within="section" />
          </div>
        </PageSection>
      )}

      {(data.prev || data.next) && (
        <nav aria-label="Other chapter mind maps" className="grid gap-3 sm:grid-cols-2">
          {data.prev ? (
            <Link href={mindMapsPath(board.examSlug, data.subject.slug, data.prev.slug)} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/40">
              <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary" aria-hidden />
              <span>
                <span className="block text-xs text-muted-foreground">Previous chapter</span>
                <span className="font-semibold text-foreground">{data.prev.name} mind map</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {data.next && (
            <Link href={mindMapsPath(board.examSlug, data.subject.slug, data.next.slug)} className="group flex items-center justify-end gap-3 rounded-2xl border border-border bg-card p-4 text-right hover:border-primary/40">
              <span>
                <span className="block text-xs text-muted-foreground">Next chapter</span>
                <span className="font-semibold text-foreground">{data.next.name} mind map</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" aria-hidden />
            </Link>
          )}
        </nav>
      )}

      <PageSection id="faq" title={`${data.chapter.name} mind map: common questions`}>
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {faqs.map((f) => (
            <details key={f.question} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-foreground">
                {f.question}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="text-body-md mt-3 text-muted-foreground">{f.answer}</p>
            </details>
          ))}
        </div>
      </PageSection>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'LearningResource',
          name: title,
          description: intro,
          url: absoluteUrl(path),
          learningResourceType: 'Mind map',
          educationalLevel: `CBSE ${c}`,
          inLanguage: 'en-IN',
          isAccessibleForFree: true,
          teaches: topics.map((t) => t.label),
          about: { '@type': 'Thing', name: `${subject}: ${data.chapter.name}` },
          datePublished: data.publishedAt.toISOString(),
          dateModified: data.publishedAt.toISOString(),
          publisher: ORGANIZATION,
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
        }}
      />
    </CbsePageShell>
  );
}

// ── Resolution & metadata ──────────────────────────────────────────────────────

export function mindMapSubpage(board: CbseBoard, rest: string[]): ExamSubpage | null {
  const c = board.shortLabel;
  const label = board.label;

  if (rest.length === 0) {
    return {
      metadata: async (exam): Promise<Metadata> => {
        const index = await loadMindMapIndex(exam);
        const total = index.reduce((n, s) => n + s.chapters.length, 0);
        return cbseMeta(
          mindMapsPath(board.examSlug),
          `${label} Mind Maps: Chapter-wise Visual Revision`,
          `Interactive chapter-wise mind maps for ${label}${total ? ` — ${total} chapter${total === 1 ? '' : 's'}` : ''}. Expand topics and subtopics, search, and jump to practice MCQs and notes for each topic.`,
          { noindex: total === 0 },
        );
      },
      render: async (exam) => <HubPage board={board} index={await loadMindMapIndex(exam)} />,
    };
  }

  if (rest.length === 1) {
    const findEntry = async (exam: Parameters<typeof loadMindMapIndex>[0]) => (await loadMindMapIndex(exam)).find((s) => s.subject.segment === rest[0] && s.chapters.length > 0);
    return {
      metadata: async (exam) => {
        const entry = await findEntry(exam);
        if (!entry) return {};
        const subject = board.shortSubjectName(entry.subject.name);
        return cbseMeta(
          mindMapsPath(board.examSlug, entry.subject.slug),
          `${c} ${subject} Mind Maps: Chapter-wise Revision`,
          clip(`Interactive ${label} ${subject} mind maps for ${listFormat.format(entry.chapters.map((ch) => ch.name).slice(0, 4))}${entry.chapters.length > 4 ? ' and more' : ''}, with topic-wise practice links.`, 160),
        );
      },
      render: async (exam) => {
        const entry = await findEntry(exam);
        if (!entry) notFound();
        return <SubjectPage board={board} entry={entry} />;
      },
    };
  }

  if (rest.length === 2) {
    return {
      metadata: async (exam) => {
        const data = await loadChapterMindMap(exam, rest[0], rest[1]);
        if (!data) return {};
        const subject = board.shortSubjectName(data.subject.name);
        const topics = data.snapshot.nodes.map((n) => n.label);
        return cbseMeta(
          mindMapsPath(board.examSlug, data.subject.slug, data.chapter.slug),
          data.snapshot.seoTitle ?? `${c} ${subject} ${data.chapter.name} Mind Map`,
          data.snapshot.seoDescription ??
            clip(`Explore the ${label} ${subject} ${data.chapter.name} mind map. Understand ${listFormat.format(topics.slice(0, 4))}${topics.length > 4 ? ' and more' : ''} through an interactive diagram, quick revision and practice questions.`, 160),
          {
            type: 'article',
            image: {
              url: `/api/og/mind-map?${new URLSearchParams({ chapter: data.chapter.name, subject, eyebrow: `CBSE ${c}`, topics: topics.slice(0, 6).join('|') })}`,
              alt: `${data.chapter.name} mind map: ${listFormat.format(topics.slice(0, 4))}`,
            },
          },
        );
      },
      render: async (exam) => {
        const data = await loadChapterMindMap(exam, rest[0], rest[1]);
        if (!data) notFound();
        return <ChapterPage board={board} data={data} />;
      },
    };
  }

  return null;
}
