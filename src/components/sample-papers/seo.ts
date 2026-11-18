import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';
import { examEvent, periodLabel, samplePapersPath, sessionLabel, type SamplePaperExamConfig } from '@/lib/sample-papers';
import type { PublicSamplePaper } from '@/server/repositories/sample-paper.repository';

// Titles, descriptions, FAQs and JSON-LD for the sample-paper pages. Titles lead with the
// exact phrase students search ("CBSE Class 10 Maths sample paper 2025-26", "NIMCET sample
// paper 2026"). Board exams also carry the exam year as a keyword, since students search
// both "2025-26" and "2026".

export interface Faq {
  question: string;
  answer: string;
}

function meta(path: string, title: string, description: string, keywords: string[]): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: 'website', siteName: SITE_NAME },
    twitter: { card: 'summary', title, description },
  };
}

function yearKeywords(cfg: SamplePaperExamConfig, year: number, suffix = ''): string[] {
  const base = `${cfg.label}${suffix} sample paper`;
  return cfg.isBoard ? [`${base} ${sessionLabel(year)}`, `${base} ${year}`] : [`${base} ${year}`];
}

export function hubMetadata(examSlug: string, cfg: SamplePaperExamConfig, latestYear: number): Metadata {
  const p = periodLabel(cfg, latestYear);
  return meta(
    samplePapersPath(examSlug),
    `${cfg.label} Sample Paper ${p} with Marking Scheme (All Subjects)`,
    `Read the official ${cfg.label} sample papers for ${p} online, subject by subject, with marking schemes. See the latest paper pattern and earlier years' papers in one place.`,
    [...yearKeywords(cfg, latestYear), `${cfg.label} marking scheme`, `${cfg.label} sample question paper`],
  );
}

/** Hub for an exam with nothing published yet: useful to visitors, kept out of the index. */
export function emptyHubMetadata(examSlug: string, cfg: SamplePaperExamConfig): Metadata {
  return {
    title: `${cfg.label} Sample Papers`,
    description: `${cfg.label} sample papers and marking schemes will be published here.`,
    alternates: { canonical: samplePapersPath(examSlug) },
    robots: { index: false, follow: true },
  };
}

export function yearMetadata(examSlug: string, cfg: SamplePaperExamConfig, year: number, count: number): Metadata {
  const p = periodLabel(cfg, year);
  return meta(
    samplePapersPath(examSlug, year),
    `${cfg.label} Sample Paper ${p}: All ${count} Subject${count === 1 ? '' : 's'} & Marking Schemes`,
    `All ${count} official ${cfg.label} sample question paper${count === 1 ? '' : 's'} for ${p} (${examEvent(cfg, year)}), each with its marking scheme, to read online.`,
    [...yearKeywords(cfg, year), `${cfg.label} marking scheme ${p}`],
  );
}

export function paperMetadata(examSlug: string, cfg: SamplePaperExamConfig, paper: PublicSamplePaper): Metadata {
  const p = periodLabel(cfg, paper.year);
  return meta(
    samplePapersPath(examSlug, paper.year, paper.subjectSlug),
    `${cfg.label} ${paper.subject} Sample Paper ${p}${paper.hasMarkingScheme ? ' with Marking Scheme' : ''}`,
    `Read the official ${cfg.label} ${paper.subject} sample question paper for ${p}${paper.hasMarkingScheme ? ' and its marking scheme' : ''} online. See the latest pattern, section-wise marks and how answers are marked before the ${examEvent(cfg, paper.year)}.`,
    [...yearKeywords(cfg, paper.year, ` ${paper.subject}`), `${cfg.label} ${paper.subject} marking scheme`],
  );
}

export function hubFaqs(cfg: SamplePaperExamConfig, latestYear: number): Faq[] {
  const p = periodLabel(cfg, latestYear);
  const setter = cfg.creator?.alternateName ?? 'The exam body';
  return [
    {
      question: `What is the ${cfg.label} sample paper ${p}?`,
      answer: `It is the official sample question paper published for every ${cfg.label} subject before the ${examEvent(cfg, latestYear)}. It follows the current syllabus and paper design, so it shows the sections, question types, choices and marks you will see in the real paper.`,
    },
    {
      question: `Do the ${cfg.label} sample papers come with marking schemes?`,
      answer: `${setter} releases a marking scheme alongside most sample papers. It gives the expected answer points and how marks are split within each answer, which is the best guide to how your paper will be marked. Open any subject to read both.`,
    },
    {
      question: `Will questions from the sample paper come in the ${cfg.label} exam?`,
      answer: `Not the same questions. The sample paper is a blueprint: the real paper keeps its structure, question types and difficulty level, so practising it tells you exactly what to expect and where to spend your time.`,
    },
    {
      question: 'How should I use a sample paper in my preparation?',
      answer: 'Finish the syllabus first, then solve each sample paper in one sitting within the official time limit. Check your answers against the marking scheme, note which steps earn marks, and revise the chapters where you lost them before attempting the next paper.',
    },
    {
      question: 'Are previous years’ sample papers still useful?',
      answer: `Yes, for practice, as long as you check what changed. Older papers are good extra practice on the same chapters; use the ${p} paper as the reference for the current pattern and syllabus.`,
    },
  ];
}

export function paperFaqs(cfg: SamplePaperExamConfig, paper: PublicSamplePaper): Faq[] {
  const p = periodLabel(cfg, paper.year);
  return [
    {
      question: `Is this the official ${cfg.label} ${paper.subject} sample paper for ${p}?`,
      answer: `Yes. This is the official ${cfg.label} ${paper.subject} sample question paper for ${p}${paper.hasMarkingScheme ? ', shown with its official marking scheme' : ''}.`,
    },
    {
      question: `How long should I take to solve the ${paper.subject} sample paper?`,
      answer: `Attempt it in one sitting within the time printed on the paper, exactly as in the real exam. Reading every section first and planning the time for each one is part of the practice.`,
    },
    ...(paper.hasMarkingScheme
      ? [
          {
            question: `How do I use the ${paper.subject} marking scheme?`,
            answer: `After solving the paper, open the Marking scheme tab and compare each answer with the value points listed. Marks are awarded for steps and key points, not only the final answer, so note which steps you missed.`,
          },
        ]
      : []),
    {
      question: `Can I download the ${paper.subject} sample paper?`,
      answer: `Yes. Sign in (it's free) and use the Download button above the paper to save the ${paper.hasMarkingScheme ? 'question paper or the marking scheme' : 'question paper'} as a PDF. Without signing in you can still read the full paper here on any device.`,
    },
  ];
}

export function faqJsonLd(faqs: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  };
}

const PUBLISHER = { '@type': 'Organization', name: SITE_NAME, url: SITE_URL };

export function collectionJsonLd(path: string, name: string, description: string, examSlug: string, cfg: SamplePaperExamConfig, papers: PublicSamplePaper[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: new URL(path, SITE_URL).toString(),
    publisher: PUBLISHER,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: papers.length,
      itemListElement: papers.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${cfg.label} ${p.subject} Sample Paper ${periodLabel(cfg, p.year)}`,
        url: new URL(samplePapersPath(examSlug, p.year, p.subjectSlug), SITE_URL).toString(),
      })),
    },
  };
}

export function paperJsonLd(examSlug: string, cfg: SamplePaperExamConfig, paper: PublicSamplePaper, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: `${cfg.label} ${paper.subject} Sample Paper ${periodLabel(cfg, paper.year)}`,
    description,
    url: new URL(samplePapersPath(examSlug, paper.year, paper.subjectSlug), SITE_URL).toString(),
    learningResourceType: paper.hasMarkingScheme ? ['Sample question paper', 'Marking scheme'] : 'Sample question paper',
    educationalLevel: cfg.educationalLevel,
    educationalUse: 'Exam preparation',
    about: { '@type': 'Thing', name: paper.subject },
    inLanguage: 'en-IN',
    isAccessibleForFree: true,
    dateModified: paper.updatedAt.toISOString(),
    ...(cfg.creator ? { creator: { '@type': 'Organization', ...cfg.creator } } : {}),
    publisher: PUBLISHER,
  };
}
