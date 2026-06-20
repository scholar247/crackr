#!/usr/bin/env npx tsx
/**
 * Seed NIMCET General English — chapters (topics) + 96 MCQs (16 per chapter × 6 chapters)
 * Phase 1: resolve subject ID via /api/seed/lookup, create topics via /api/seed/topics
 * Phase 2: create MCQs via /api/seed/mcqs
 *
 * Run: npx tsx scripts/seed-nimcet-english.ts
 */

export {};

const BASE    = 'https://scholar247.org';
const KEY     = 'd846e4f1862433c8d265f459f5264b721c28a93057c9b7949d8a4cf98e7bdb9f';
const EXAM_ID = '626534b9-0ac4-4d73-a400-7391b645338a';

// ─── Chapter definitions ──────────────────────────────────────────────────────

const CHAPTERS = [
  { key: 'RC',  slug: 'nimcet-general-english-reading-comprehension',
    name: 'Reading Comprehension',
    desc: 'Unseen passage-based questions testing comprehension, inference, vocabulary in context, and identification of tone/purpose.',
    order: 0 },
  { key: 'VOC', slug: 'nimcet-general-english-vocabulary-synonyms-antonyms',
    name: 'Vocabulary – Synonyms & Antonyms',
    desc: 'Questions on word meanings, synonyms (words of similar meaning) and antonyms (words of opposite meaning) from the NIMCET pattern.',
    order: 1 },
  { key: 'GR',  slug: 'nimcet-general-english-grammar-usage',
    name: 'Grammar & Usage',
    desc: 'Rules of grammar including tenses, articles, prepositions, subject-verb agreement, voice transformation, and narration.',
    order: 2 },
  { key: 'FIB', slug: 'nimcet-general-english-fill-in-the-blanks',
    name: 'Fill in the Blanks',
    desc: 'Selecting the most appropriate word or phrase to complete a sentence based on context, grammar, and vocabulary.',
    order: 3 },
  { key: 'ERR', slug: 'nimcet-general-english-error-identification',
    name: 'Error Identification',
    desc: 'Identifying the part of a sentence (A/B/C/D) that contains a grammatical or usage error.',
    order: 4 },
  { key: 'SC',  slug: 'nimcet-general-english-sentence-correction',
    name: 'Sentence Correction',
    desc: 'Choosing the correctly restructured or grammatically improved version of a given incorrect sentence.',
    order: 5 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type D = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
type CK = 'RC' | 'VOC' | 'GR' | 'FIB' | 'ERR' | 'SC';

interface Q {
  ck: CK;
  d: D;
  q: string;
  o: { c: string; ok: boolean }[];
  ex?: string;
  py?: boolean;
}

// ─── MCQs ─────────────────────────────────────────────────────────────────────

const MCQS: Q[] = [

// ════════════════════════════════════════════════════════════════════════════
// READING COMPREHENSION (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'RC', d:'EASY', py:false,
  q:'Passage: "Books are the mirrors of the soul. Reading regularly enriches the mind, broadens one\'s perspective, and reduces stress." What is the main idea of the passage?',
  o:[{c:'Reading benefits the mind in multiple ways',ok:true},{c:'Books are expensive',ok:false},{c:'Mirrors reflect one\'s appearance',ok:false},{c:'Stress is caused by lack of reading',ok:false}],
  ex:'The passage lists multiple mental benefits of reading — this is the central theme.' },

{ ck:'RC', d:'EASY', py:false,
  q:'Passage: "Technology has transformed communication. People can now connect instantly across continents. However, this convenience has led to reduced face-to-face interaction." Which of the following best describes the passage?',
  o:[{c:'Technology has both advantages and disadvantages',ok:true},{c:'Technology only brings disadvantages',ok:false},{c:'Face-to-face interaction is outdated',ok:false},{c:'Technology is irrelevant to communication',ok:false}],
  ex:'The passage presents both a benefit (instant connection) and a drawback (reduced face-to-face interaction).' },

{ ck:'RC', d:'EASY', py:true,
  q:'Passage: "The rainforest is home to more than half of the world\'s species. Yet it is being destroyed at an alarming rate. Experts warn this could trigger irreversible ecological damage." What can be inferred?',
  o:[{c:'Rainforest destruction may cause permanent harm to ecosystems',ok:true},{c:'Experts support deforestation',ok:false},{c:'Rainforests cover most of the earth',ok:false},{c:'Species are thriving despite deforestation',ok:false}],
  ex:'The passage says damage could be "irreversible" — meaning permanent harm can be inferred.' },

{ ck:'RC', d:'EASY', py:false,
  q:'Passage: "Exercise improves cardiovascular health, strengthens bones, and boosts mood through the release of endorphins. It is not just about looking good." According to the passage, one benefit of exercise is:',
  o:[{c:'Improved mood through endorphins',ok:true},{c:'Weight loss only',ok:false},{c:'Better digestion',ok:false},{c:'Improved eyesight',ok:false}],
  ex:'The passage explicitly states exercise "boosts mood through the release of endorphins".' },

{ ck:'RC', d:'MEDIUM', py:false,
  q:'Passage: "AI algorithms can analyse medical images with accuracy surpassing human radiologists. However, concerns about data privacy and the role of human judgment remain unresolved." The author\'s tone towards AI in healthcare is:',
  o:[{c:'Cautiously optimistic',ok:true},{c:'Entirely negative',ok:false},{c:'Uncritically enthusiastic',ok:false},{c:'Completely indifferent',ok:false}],
  ex:'The passage acknowledges AI\'s accuracy (positive) but flags unresolved concerns (cautious) — cautiously optimistic.' },

{ ck:'RC', d:'MEDIUM', py:true,
  q:'Passage: "The Renaissance marked a shift from medieval religious art to humanistic themes. Artists like Leonardo da Vinci embodied this spirit by combining art with scientific inquiry." Which best captures the Renaissance spirit as described?',
  o:[{c:'Integration of art and scientific thinking focused on human experience',ok:true},{c:'Exclusive focus on religious themes',ok:false},{c:'Rejection of all previous art',ok:false},{c:'Scientific discoveries replacing art entirely',ok:false}],
  ex:'The passage describes humanistic themes + art combined with science = integration of art and human/scientific inquiry.' },

{ ck:'RC', d:'MEDIUM', py:false,
  q:'Passage: "Language is not merely a tool for communication; it is a window into culture and history. Words that have no equivalent in other languages reveal the unique experiences of a society." What does the author imply about untranslatable words?',
  o:[{c:'They reflect unique cultural experiences of a society',ok:true},{c:'All languages have equivalent words for every concept',ok:false},{c:'Translation is always possible',ok:false},{c:'Language barriers prevent all communication',ok:false}],
  ex:'The passage states untranslatable words reveal "unique experiences and values of a society".' },

{ ck:'RC', d:'MEDIUM', py:false,
  q:'Passage: "While global wealth has increased, its distribution remains highly skewed. The top 1% owns more wealth than the bottom 50% combined." The passage is primarily concerned with:',
  o:[{c:'The unequal distribution of global wealth',ok:true},{c:'The growth of global wealth alone',ok:false},{c:'Poverty in developing countries',ok:false},{c:'Economic policies of governments',ok:false}],
  ex:'The central point is the skewed distribution of wealth, not its growth.' },

{ ck:'RC', d:'HARD', py:true,
  q:'Passage: "Compatibilists maintain that free will and determinism are not mutually exclusive, suggesting that freedom consists in acting according to one\'s own desires rather than external compulsion." According to compatibilists:',
  o:[{c:'One can have free will even in a deterministic universe',ok:true},{c:'Free will and determinism are fundamentally opposed',ok:false},{c:'Human actions are entirely random',ok:false},{c:'Determinism eliminates all moral responsibility',ok:false}],
  ex:'Compatibilism holds that free will (acting from own desires) is compatible with determinism (prior causes). Hence both can coexist.' },

{ ck:'RC', d:'HARD', py:false,
  q:'Passage: "Cognitive dissonance is the discomfort felt when behaviour conflicts with beliefs. To resolve it, individuals typically rationalise their behaviour or minimise the importance of the conflict." A smoker who knows smoking is harmful but continues to smoke would reduce dissonance by:',
  o:[{c:'Rationalising that the pleasure outweighs the harm',ok:true},{c:'Seeking immediate medical advice',ok:false},{c:'Quitting smoking at once',ok:false},{c:'Accepting the contradiction permanently',ok:false}],
  ex:'Rationalising ("the pleasure is worth it") is a classic dissonance-reduction strategy mentioned in the passage.' },

{ ck:'RC', d:'HARD', py:false,
  q:'Passage: "An unreliable narrator may be unconsciously biased, self-deceived, or deliberately deceptive, requiring the reader to read between the lines and construct an alternative interpretation." The primary skill required when reading an unreliable narrator is:',
  o:[{c:'Critical interpretation beyond the narrator\'s own perspective',ok:true},{c:'Complete trust in the narrator\'s account',ok:false},{c:'Identifying factual historical errors',ok:false},{c:'Knowledge of the author\'s biography',ok:false}],
  ex:'The passage explicitly says the reader must "read between the lines" and construct an alternative interpretation.' },

{ ck:'RC', d:'HARD', py:true,
  q:'Passage: "Climate models predict that a 1.5°C rise in global temperatures could cause extreme weather events and loss of biodiversity. The challenge lies in accounting for the inherent uncertainties in long-range forecasting." The passage acknowledges that:',
  o:[{c:'Climate models carry inherent uncertainties',ok:true},{c:'A 1.5°C rise is impossible to prevent',ok:false},{c:'Biodiversity loss is unrelated to temperature',ok:false},{c:'All climate predictions are accurate',ok:false}],
  ex:'The passage explicitly states "inherent uncertainties in long-range forecasting".' },

{ ck:'RC', d:'EXPERT', py:false,
  q:'Passage: "Postmodernism questions the existence of objective truth, arguing knowledge is always partial and influenced by power. Critics contend this leads to relativism that undermines rational discourse and emancipatory politics." The central tension in the passage is:',
  o:[{c:'Between postmodern scepticism and the need for rational, emancipatory discourse',ok:true},{c:'Between science and religion',ok:false},{c:'Between tradition and modernity',ok:false},{c:'Between politics and aesthetics',ok:false}],
  ex:'The tension is: postmodernism denies objective truth ↔ critics say this undermines rational/emancipatory discourse.' },

{ ck:'RC', d:'EXPERT', py:true,
  q:'Passage: "The weak Sapir-Whorf hypothesis suggests language influences thought without determining it. Empirical evidence largely supports this weak version." Based on the passage, which is most accurate?',
  o:[{c:'Language influences but does not fully determine how we think',ok:true},{c:'All languages produce identical cognitive frameworks',ok:false},{c:'There is no relationship between language and thought',ok:false},{c:'The strong version is empirically well-supported',ok:false}],
  ex:'The passage says evidence supports the "weak version" — language influences (not determines) thought.' },

{ ck:'RC', d:'EXPERT', py:false,
  q:'Passage: "The second law of thermodynamics states that total entropy of an isolated system never decreases. Philosophically extended, this suggests the universe tends toward greater disorder — sometimes called \'heat death\'." The philosophical extension implies:',
  o:[{c:'The universe will eventually reach a state of maximum disorder',ok:true},{c:'Entropy can be permanently reversed',ok:false},{c:'Systems always tend toward greater order',ok:false},{c:'Heat death has already been observed',ok:false}],
  ex:'Maximum entropy = maximum disorder = "heat death". This is the philosophical implication described.' },

{ ck:'RC', d:'EXPERT', py:false,
  q:'Passage: "Popper\'s paradox of tolerance states that a society tolerant without limit will ultimately be seized by the intolerant. To preserve tolerance, society must be intolerant of intolerance itself." The logical structure Popper employs is:',
  o:[{c:'The conditions that sustain a principle may require limiting that principle',ok:true},{c:'Tolerance is always self-defeating',ok:false},{c:'Intolerance should be universally condemned',ok:false},{c:'Unlimited tolerance leads to democracy',ok:false}],
  ex:'Popper\'s argument: to sustain tolerance (the principle), you must limit it (intolerance of intolerance). This is a self-referential limiting condition.' },

// ════════════════════════════════════════════════════════════════════════════
// VOCABULARY – SYNONYMS & ANTONYMS (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'VOC', d:'EASY', py:false,
  q:'Choose the word closest in meaning to BENEVOLENT:',
  o:[{c:'Generous',ok:true},{c:'Hostile',ok:false},{c:'Cruel',ok:false},{c:'Indifferent',ok:false}],
  ex:'Benevolent means well-meaning and generous. Synonym: Generous.' },

{ ck:'VOC', d:'EASY', py:false,
  q:'Choose the word most OPPOSITE in meaning to LENIENT:',
  o:[{c:'Strict',ok:true},{c:'Kind',ok:false},{c:'Gentle',ok:false},{c:'Soft',ok:false}],
  ex:'Lenient means permissive/tolerant; its antonym is Strict.' },

{ ck:'VOC', d:'EASY', py:true,
  q:'Choose the word closest in meaning to CANDID:',
  o:[{c:'Frank',ok:true},{c:'Evasive',ok:false},{c:'Secretive',ok:false},{c:'Cunning',ok:false}],
  ex:'Candid means open and honest. Synonym: Frank.' },

{ ck:'VOC', d:'EASY', py:false,
  q:'Choose the word most OPPOSITE in meaning to EMINENT:',
  o:[{c:'Unknown',ok:true},{c:'Famous',ok:false},{c:'Prominent',ok:false},{c:'Gifted',ok:false}],
  ex:'Eminent means famous/distinguished; its antonym is Unknown/obscure.' },

{ ck:'VOC', d:'MEDIUM', py:true,
  q:'Choose the word closest in meaning to PERNICIOUS:',
  o:[{c:'Harmful',ok:true},{c:'Pleasant',ok:false},{c:'Trivial',ok:false},{c:'Helpful',ok:false}],
  ex:'Pernicious means having a harmful effect. Synonym: Harmful.' },

{ ck:'VOC', d:'MEDIUM', py:false,
  q:'Choose the word most OPPOSITE in meaning to PLACID:',
  o:[{c:'Turbulent',ok:true},{c:'Quiet',ok:false},{c:'Serene',ok:false},{c:'Still',ok:false}],
  ex:'Placid means calm and still; its antonym is Turbulent.' },

{ ck:'VOC', d:'MEDIUM', py:true,
  q:'Choose the word closest in meaning to EQUIVOCAL:',
  o:[{c:'Ambiguous',ok:true},{c:'Clear',ok:false},{c:'Certain',ok:false},{c:'Definitive',ok:false}],
  ex:'Equivocal means open to two or more interpretations. Synonym: Ambiguous.' },

{ ck:'VOC', d:'MEDIUM', py:false,
  q:'Choose the word most OPPOSITE in meaning to FRUGAL:',
  o:[{c:'Extravagant',ok:true},{c:'Economical',ok:false},{c:'Thrifty',ok:false},{c:'Careful',ok:false}],
  ex:'Frugal means sparing/economical; its antonym is Extravagant.' },

{ ck:'VOC', d:'HARD', py:true,
  q:'Choose the word closest in meaning to LOQUACIOUS:',
  o:[{c:'Talkative',ok:true},{c:'Silent',ok:false},{c:'Reserved',ok:false},{c:'Wise',ok:false}],
  ex:'Loquacious means tending to talk a great deal. Synonym: Talkative.' },

{ ck:'VOC', d:'HARD', py:false,
  q:'Choose the word most OPPOSITE in meaning to EPHEMERAL:',
  o:[{c:'Permanent',ok:true},{c:'Fleeting',ok:false},{c:'Brief',ok:false},{c:'Momentary',ok:false}],
  ex:'Ephemeral means lasting a very short time; its antonym is Permanent.' },

{ ck:'VOC', d:'HARD', py:false,
  q:'Choose the word closest in meaning to OBSEQUIOUS:',
  o:[{c:'Servile',ok:true},{c:'Proud',ok:false},{c:'Bold',ok:false},{c:'Assertive',ok:false}],
  ex:'Obsequious means excessively compliant or fawning. Synonym: Servile.' },

{ ck:'VOC', d:'HARD', py:true,
  q:'Choose the word most OPPOSITE in meaning to PROFLIGATE:',
  o:[{c:'Frugal',ok:true},{c:'Wasteful',ok:false},{c:'Indulgent',ok:false},{c:'Reckless',ok:false}],
  ex:'Profligate means recklessly wasteful; its antonym is Frugal.' },

{ ck:'VOC', d:'EXPERT', py:true,
  q:'Choose the word closest in meaning to PUSILLANIMOUS:',
  o:[{c:'Cowardly',ok:true},{c:'Brave',ok:false},{c:'Resolute',ok:false},{c:'Wise',ok:false}],
  ex:'Pusillanimous means lacking courage or determination. Synonym: Cowardly.' },

{ ck:'VOC', d:'EXPERT', py:false,
  q:'Choose the word most OPPOSITE in meaning to VOCIFEROUS:',
  o:[{c:'Silent',ok:true},{c:'Loud',ok:false},{c:'Boisterous',ok:false},{c:'Angry',ok:false}],
  ex:'Vociferous means loud and forceful; its antonym is Silent.' },

{ ck:'VOC', d:'EXPERT', py:false,
  q:'Choose the word closest in meaning to SYCOPHANT:',
  o:[{c:'Flatterer',ok:true},{c:'Critic',ok:false},{c:'Rebel',ok:false},{c:'Visionary',ok:false}],
  ex:'A sycophant is someone who excessively flatters to gain favour. Synonym: Flatterer.' },

{ ck:'VOC', d:'EXPERT', py:true,
  q:'Choose the word most OPPOSITE in meaning to MENDACIOUS:',
  o:[{c:'Truthful',ok:true},{c:'Deceitful',ok:false},{c:'Untrustworthy',ok:false},{c:'Cunning',ok:false}],
  ex:'Mendacious means not telling the truth; its antonym is Truthful.' },

// ════════════════════════════════════════════════════════════════════════════
// GRAMMAR & USAGE (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'GR', d:'EASY', py:false,
  q:'Choose the correct article: "He is ___ honest man."',
  o:[{c:'an',ok:true},{c:'a',ok:false},{c:'the',ok:false},{c:'No article needed',ok:false}],
  ex:'"Honest" begins with a vowel sound /ɒ/, so "an" is used before it.' },

{ ck:'GR', d:'EASY', py:false,
  q:'Choose the correct preposition: "She is good ___ mathematics."',
  o:[{c:'at',ok:true},{c:'in',ok:false},{c:'on',ok:false},{c:'with',ok:false}],
  ex:'"Good at" is the correct collocations. "Good at" = skilled in a subject.' },

{ ck:'GR', d:'EASY', py:true,
  q:'Fill in with correct tense: "She ___ to school every day." (go)',
  o:[{c:'goes',ok:true},{c:'is going',ok:false},{c:'went',ok:false},{c:'has gone',ok:false}],
  ex:'Present simple (habitual action): "She goes to school every day."' },

{ ck:'GR', d:'EASY', py:false,
  q:'Identify the correct sentence for subject-verb agreement:',
  o:[{c:'The team is performing well.',ok:true},{c:'The team are performs well.',ok:false},{c:'The team have performing well.',ok:false},{c:'The team performing well.',ok:false}],
  ex:'"Team" is a collective noun treated as singular in American/formal English: "team is".' },

{ ck:'GR', d:'MEDIUM', py:true,
  q:'Choose the correct passive voice for: "The teacher teaches the students."',
  o:[{c:'The students are taught by the teacher.',ok:true},{c:'The students were taught by the teacher.',ok:false},{c:'The teacher is taught by the students.',ok:false},{c:'The students have been taught.',ok:false}],
  ex:'Active present simple → passive: "are + past participle + by + agent".' },

{ ck:'GR', d:'MEDIUM', py:false,
  q:'Convert to indirect speech: He said, "I am going home."',
  o:[{c:'He said that he was going home.',ok:true},{c:'He said that I am going home.',ok:false},{c:'He told that he is going home.',ok:false},{c:'He said that he will go home.',ok:false}],
  ex:'"Am going" becomes "was going" (backshift). "I" → "he". "said" takes a that-clause.' },

{ ck:'GR', d:'MEDIUM', py:false,
  q:'Choose the correct form: "If I ___ rich, I would travel the world."',
  o:[{c:'were',ok:true},{c:'was',ok:false},{c:'am',ok:false},{c:'had been',ok:false}],
  ex:'Hypothetical present condition uses the subjunctive "were" regardless of person.' },

{ ck:'GR', d:'MEDIUM', py:true,
  q:'Identify the correct sentence:',
  o:[{c:'Neither of the two books is interesting.',ok:true},{c:'Neither of the two books are interesting.',ok:false},{c:'Neither of the two books were interesting.',ok:false},{c:'Neither of the two books have been interesting.',ok:false}],
  ex:'"Neither of" takes a singular verb: "Neither of the two books is…"' },

{ ck:'GR', d:'HARD', py:true,
  q:'Identify the correctly formed conditional:',
  o:[{c:'Had he studied harder, he would have passed.',ok:true},{c:'Had he studied harder, he would pass.',ok:false},{c:'If he would have studied harder, he would have passed.',ok:false},{c:'If he studied harder, he would have passed.',ok:false}],
  ex:'Inverted third conditional: "Had + subject + past participle, … would have …" is grammatically correct.' },

{ ck:'GR', d:'HARD', py:false,
  q:'Choose the correct sentence:',
  o:[{c:'He insisted on my attending the meeting.',ok:true},{c:'He insisted on me to attend the meeting.',ok:false},{c:'He insisted that I to attend the meeting.',ok:false},{c:'He insisted me attending the meeting.',ok:false}],
  ex:'"Insist on" takes a gerund. The possessive "my" (not "me") precedes the gerund "attending".' },

{ ck:'GR', d:'HARD', py:false,
  q:'Select the sentence with correct parallel structure:',
  o:[{c:'She likes reading, swimming, and cycling.',ok:true},{c:'She likes reading, swimming, and to cycle.',ok:false},{c:'She likes to read, swimming, and cycling.',ok:false},{c:'She likes to read, to swim, and cycling.',ok:false}],
  ex:'Parallel structure requires the same grammatical form throughout: all gerunds (reading, swimming, cycling).' },

{ ck:'GR', d:'HARD', py:true,
  q:'Identify the sentence with a dangling modifier:',
  o:[{c:'Walking down the street, the trees looked beautiful.',ok:true},{c:'Walking down the street, she noticed the beautiful trees.',ok:false},{c:'She noticed the trees were beautiful while walking.',ok:false},{c:'The beautiful trees caught her eye as she walked.',ok:false}],
  ex:'In option A, the subject of "walking" is unclear — "the trees" cannot walk. This is a dangling modifier.' },

{ ck:'GR', d:'EXPERT', py:false,
  q:'Choose the sentence where the subjunctive is correctly used:',
  o:[{c:'The judge demanded that the defendant be present.',ok:true},{c:'The judge demanded that the defendant is present.',ok:false},{c:'The judge demanded that the defendant was present.',ok:false},{c:'The judge demanded that the defendant will be present.',ok:false}],
  ex:'After verbs of demand/suggestion/request, the subjunctive base form (be, not is/was) is correct.' },

{ ck:'GR', d:'EXPERT', py:true,
  q:'"No sooner ___ the clock struck midnight ___ the party ended." Choose the correct form:',
  o:[{c:'had … than',ok:true},{c:'did … than',ok:false},{c:'had … when',ok:false},{c:'did … when',ok:false}],
  ex:'"No sooner had + subject + V3 + than…" is the correct inverted structure for this correlative.' },

{ ck:'GR', d:'EXPERT', py:false,
  q:'Identify the correctly used gerund sentence:',
  o:[{c:'She denied having stolen the jewellery.',ok:true},{c:'She denied to have stolen the jewellery.',ok:false},{c:'She denied to steal the jewellery.',ok:false},{c:'She denied that stealing the jewellery.',ok:false}],
  ex:'"Deny" always takes a gerund (V+ing). "Deny having done" is the perfect gerund form.' },

{ ck:'GR', d:'EXPERT', py:false,
  q:'Select the sentence with the correct use of "whom":',
  o:[{c:'Whom did you speak to at the meeting?',ok:true},{c:'Who did you speak to at the meeting?',ok:false},{c:'To who did you speak at the meeting?',ok:false},{c:'With who did you speak at the meeting?',ok:false}],
  ex:'"Whom" is the object form; it is the object of the preposition "to" — "to whom" is correct.' },

// ════════════════════════════════════════════════════════════════════════════
// FILL IN THE BLANKS (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'FIB', d:'EASY', py:false,
  q:'The judge ___ the accused after finding insufficient evidence. (choose the most appropriate word)',
  o:[{c:'acquitted',ok:true},{c:'convicted',ok:false},{c:'prosecuted',ok:false},{c:'charged',ok:false}],
  ex:'"Acquitted" means found not guilty and released — appropriate after "insufficient evidence".' },

{ ck:'FIB', d:'EASY', py:false,
  q:'Hard work and ___ are the twin pillars of success.',
  o:[{c:'dedication',ok:true},{c:'laziness',ok:false},{c:'ignorance',ok:false},{c:'failure',ok:false}],
  ex:'"Dedication" collocates naturally with "hard work" as a positive quality for success.' },

{ ck:'FIB', d:'EASY', py:true,
  q:'The doctor advised him to take ___ rest.',
  o:[{c:'adequate',ok:true},{c:'negligible',ok:false},{c:'partial',ok:false},{c:'irregular',ok:false}],
  ex:'"Adequate rest" = sufficient rest as prescribed by a doctor; the standard medical advice phrasing.' },

{ ck:'FIB', d:'EASY', py:false,
  q:'She spoke with great ___ and clarity during the presentation.',
  o:[{c:'eloquence',ok:true},{c:'rudeness',ok:false},{c:'confusion',ok:false},{c:'silence',ok:false}],
  ex:'"Eloquence" (fluent, persuasive expression) + clarity go together in formal speech.' },

{ ck:'FIB', d:'MEDIUM', py:true,
  q:'Despite his ___ efforts, the project failed to meet the deadline.',
  o:[{c:'strenuous',ok:true},{c:'casual',ok:false},{c:'minimal',ok:false},{c:'ordinary',ok:false}],
  ex:'"Despite strenuous efforts" creates a contrast — strong effort yet failure to meet deadline.' },

{ ck:'FIB', d:'MEDIUM', py:false,
  q:'The scientist\'s ___ discovery challenged decades of established theory.',
  o:[{c:'groundbreaking',ok:true},{c:'trivial',ok:false},{c:'routine',ok:false},{c:'minor',ok:false}],
  ex:'"Groundbreaking discovery" + "challenged established theory" is a natural collocations.' },

{ ck:'FIB', d:'MEDIUM', py:false,
  q:'The government must take ___ steps to curb inflation before it spirals out of control.',
  o:[{c:'decisive',ok:true},{c:'indecisive',ok:false},{c:'passive',ok:false},{c:'negligent',ok:false}],
  ex:'"Decisive steps" implies firm, determined action — appropriate in an urgent policy context.' },

{ ck:'FIB', d:'MEDIUM', py:true,
  q:'The diplomat tried to ___ tensions between the two nations through dialogue.',
  o:[{c:'mitigate',ok:true},{c:'aggravate',ok:false},{c:'escalate',ok:false},{c:'inflame',ok:false}],
  ex:'"Mitigate" means to make less severe — a diplomat\'s goal is to reduce, not worsen, tensions.' },

{ ck:'FIB', d:'HARD', py:true,
  q:'His argument was ___ and full of logical fallacies disguised as reasoned debate.',
  o:[{c:'specious',ok:true},{c:'sound',ok:false},{c:'cogent',ok:false},{c:'lucid',ok:false}],
  ex:'"Specious" means superficially plausible but actually wrong — matching "logical fallacies disguised".' },

{ ck:'FIB', d:'HARD', py:false,
  q:'The controversial policy was ___ despite widespread public opposition.',
  o:[{c:'promulgated',ok:true},{c:'rescinded',ok:false},{c:'abandoned',ok:false},{c:'repealed',ok:false}],
  ex:'"Promulgated" means officially put into effect — consistent with it being enforced "despite opposition".' },

{ ck:'FIB', d:'HARD', py:false,
  q:'The committee\'s decision appeared ___ rather than based on long-term principle.',
  o:[{c:'expedient',ok:true},{c:'principled',ok:false},{c:'visionary',ok:false},{c:'idealistic',ok:false}],
  ex:'"Expedient" means convenient/practical rather than principled — the direct contrast stated.' },

{ ck:'FIB', d:'HARD', py:true,
  q:'The architect\'s design was ___ in its simplicity yet profound in its impact.',
  o:[{c:'austere',ok:true},{c:'ornate',ok:false},{c:'elaborate',ok:false},{c:'complex',ok:false}],
  ex:'"Austere" (severely simple, unadorned) contrasts naturally with "profound impact".' },

{ ck:'FIB', d:'EXPERT', py:false,
  q:'Her ___ prose style belies the extraordinary complexity of her philosophical ideas.',
  o:[{c:'pellucid',ok:true},{c:'opaque',ok:false},{c:'verbose',ok:false},{c:'laboured',ok:false}],
  ex:'"Pellucid" means transparently clear — a pellucid style can be deceptively simple yet hide deep ideas.' },

{ ck:'FIB', d:'EXPERT', py:true,
  q:'The researcher\'s claims were ___ by subsequent studies that found contradictory results.',
  o:[{c:'refuted',ok:true},{c:'corroborated',ok:false},{c:'validated',ok:false},{c:'endorsed',ok:false}],
  ex:'"Refuted" = disproved. Contradictory results refute, not support, the original claims.' },

{ ck:'FIB', d:'EXPERT', py:false,
  q:'His speech was laden with ___ that greatly exaggerated the actual findings of the study.',
  o:[{c:'hyperbole',ok:true},{c:'understatement',ok:false},{c:'litotes',ok:false},{c:'irony',ok:false}],
  ex:'"Hyperbole" is deliberate exaggeration for effect — fitting "greatly exaggerated".' },

{ ck:'FIB', d:'EXPERT', py:false,
  q:'The author\'s ___ narrative technique keeps the reader perpetually uncertain about what is real.',
  o:[{c:'enigmatic',ok:true},{c:'transparent',ok:false},{c:'straightforward',ok:false},{c:'predictable',ok:false}],
  ex:'"Enigmatic" (mysterious, difficult to interpret) fits a narrative that creates uncertainty.' },

// ════════════════════════════════════════════════════════════════════════════
// ERROR IDENTIFICATION (16)
// In each question, a sentence is split into 4 parts (A)(B)(C)(D = No error).
// ════════════════════════════════════════════════════════════════════════════
{ ck:'ERR', d:'EASY', py:false,
  q:'(A) She has been working / (B) in this company / (C) since five years. / (D) No error',
  o:[{c:'C',ok:true},{c:'A',ok:false},{c:'B',ok:false},{c:'D',ok:false}],
  ex:'"Since" is used with a point in time; "for" is used with a period. Correct: "for five years".' },

{ ck:'ERR', d:'EASY', py:false,
  q:'(A) The news / (B) are shocking / (C) to all of us. / (D) No error',
  o:[{c:'B',ok:true},{c:'A',ok:false},{c:'C',ok:false},{c:'D',ok:false}],
  ex:'"News" is an uncountable noun and takes a singular verb: "The news is shocking".' },

{ ck:'ERR', d:'EASY', py:true,
  q:'(A) He is one of / (B) the best student / (C) in the class. / (D) No error',
  o:[{c:'B',ok:true},{c:'A',ok:false},{c:'C',ok:false},{c:'D',ok:false}],
  ex:'"One of" must be followed by a plural noun: "one of the best students".' },

{ ck:'ERR', d:'EASY', py:false,
  q:'(A) Hardly had I / (B) reached the station / (C) when the train left. / (D) No error',
  o:[{c:'D',ok:true},{c:'A',ok:false},{c:'B',ok:false},{c:'C',ok:false}],
  ex:'"Hardly had … when" is the correct correlative structure. The sentence is error-free.' },

{ ck:'ERR', d:'MEDIUM', py:true,
  q:'(A) She denied / (B) to have stolen / (C) the jewellery. / (D) No error',
  o:[{c:'B',ok:true},{c:'A',ok:false},{c:'C',ok:false},{c:'D',ok:false}],
  ex:'"Deny" takes a gerund, not an infinitive: "denied having stolen" is correct.' },

{ ck:'ERR', d:'MEDIUM', py:false,
  q:'(A) He prefers coffee / (B) than tea / (C) for breakfast. / (D) No error',
  o:[{c:'B',ok:true},{c:'A',ok:false},{c:'C',ok:false},{c:'D',ok:false}],
  ex:'"Prefer" is followed by "to", not "than": "He prefers coffee to tea".' },

{ ck:'ERR', d:'MEDIUM', py:false,
  q:'(A) My uncle along with / (B) his sons / (C) have gone to Delhi. / (D) No error',
  o:[{c:'C',ok:true},{c:'A',ok:false},{c:'B',ok:false},{c:'D',ok:false}],
  ex:'"Along with" is a parenthetical phrase; the subject remains singular ("uncle"). Correct: "has gone".' },

{ ck:'ERR', d:'MEDIUM', py:true,
  q:'(A) The police was / (B) alerted immediately / (C) after the incident. / (D) No error',
  o:[{c:'A',ok:true},{c:'B',ok:false},{c:'C',ok:false},{c:'D',ok:false}],
  ex:'"Police" is always treated as a plural noun: "The police were alerted".' },

{ ck:'ERR', d:'HARD', py:false,
  q:'(A) Not only did he fail / (B) but also he refused / (C) to accept his mistake. / (D) No error',
  o:[{c:'B',ok:true},{c:'A',ok:false},{c:'C',ok:false},{c:'D',ok:false}],
  ex:'"But also" must be placed after the subject-verb, not between them: "but he also refused".' },

{ ck:'ERR', d:'HARD', py:true,
  q:'(A) If I was / (B) in your position, / (C) I would have done the same. / (D) No error',
  o:[{c:'A',ok:true},{c:'B',ok:false},{c:'C',ok:false},{c:'D',ok:false}],
  ex:'Hypothetical/subjunctive condition requires "were" not "was": "If I were in your position…".' },

{ ck:'ERR', d:'HARD', py:false,
  q:'(A) The number of accidents / (B) are increasing / (C) every year. / (D) No error',
  o:[{c:'B',ok:true},{c:'A',ok:false},{c:'C',ok:false},{c:'D',ok:false}],
  ex:'"The number of" takes a singular verb: "The number of accidents is increasing".' },

{ ck:'ERR', d:'HARD', py:false,
  q:'(A) She is one of those women / (B) who is always / (C) cheerful and helpful. / (D) No error',
  o:[{c:'B',ok:true},{c:'A',ok:false},{c:'C',ok:false},{c:'D',ok:false}],
  ex:'"One of those… who" takes a plural verb: "who are always cheerful".' },

{ ck:'ERR', d:'EXPERT', py:true,
  q:'(A) He found the keys / (B) which were missing / (C) laying on the table. / (D) No error',
  o:[{c:'C',ok:true},{c:'A',ok:false},{c:'B',ok:false},{c:'D',ok:false}],
  ex:'"Laying" (transitive) requires an object. Here it should be "lying" (to be in a horizontal position).' },

{ ck:'ERR', d:'EXPERT', py:false,
  q:'(A) He is more wiser / (B) than his / (C) elder brother. / (D) No error',
  o:[{c:'A',ok:true},{c:'B',ok:false},{c:'C',ok:false},{c:'D',ok:false}],
  ex:'"Wiser" is already comparative. Adding "more" creates a double comparative — incorrect.' },

{ ck:'ERR', d:'EXPERT', py:false,
  q:'(A) No sooner did / (B) he arrived / (C) than the meeting began. / (D) No error',
  o:[{c:'B',ok:true},{c:'A',ok:false},{c:'C',ok:false},{c:'D',ok:false}],
  ex:'"No sooner did … than" uses the bare infinitive: "did he arrive" (not "arrived").' },

{ ck:'ERR', d:'EXPERT', py:true,
  q:'(A) Each of the students / (B) were asked / (C) to submit their assignment. / (D) No error',
  o:[{c:'B',ok:true},{c:'A',ok:false},{c:'C',ok:false},{c:'D',ok:false}],
  ex:'"Each of" is singular: "Each of the students was asked…". "Their" (C) is acceptable as neutral pronoun.' },

// ════════════════════════════════════════════════════════════════════════════
// SENTENCE CORRECTION (16)
// ════════════════════════════════════════════════════════════════════════════
{ ck:'SC', d:'EASY', py:false,
  q:'Correct the sentence: "She does not knows the answer."',
  o:[{c:'She does not know the answer.',ok:true},{c:'She did not knows the answer.',ok:false},{c:'She does not knew the answer.',ok:false},{c:'She has not know the answer.',ok:false}],
  ex:'"Does" is already the auxiliary for present simple; the main verb must be in bare infinitive form: "know".' },

{ ck:'SC', d:'EASY', py:false,
  q:'Correct the sentence: "My brother and me went to the market."',
  o:[{c:'My brother and I went to the market.',ok:true},{c:'Me and my brother went to the market.',ok:false},{c:'My brother and myself went to the market.',ok:false},{c:'I and my brother went to the market.',ok:false}],
  ex:'"I" (subject pronoun) is correct when the pronoun is part of the subject: "My brother and I went…".' },

{ ck:'SC', d:'EASY', py:true,
  q:'Correct the sentence: "He has went to the store."',
  o:[{c:'He has gone to the store.',ok:true},{c:'He had went to the store.',ok:false},{c:'He have gone to the store.',ok:false},{c:'He went to the store yesterday.',ok:false}],
  ex:'"Has gone" (present perfect) is correct; "went" is simple past and cannot follow "has".' },

{ ck:'SC', d:'EASY', py:false,
  q:'Correct the sentence: "The childrens played in the park."',
  o:[{c:'The children played in the park.',ok:true},{c:'The childrens\' played in the park.',ok:false},{c:'The children\'s played in the park.',ok:false},{c:'The childrens are playing in the park.',ok:false}],
  ex:'"Children" is already the irregular plural of "child" — no "s" is added.' },

{ ck:'SC', d:'MEDIUM', py:true,
  q:'Correct the sentence: "Either the manager or the employees has to attend the meeting."',
  o:[{c:'Either the manager or the employees have to attend the meeting.',ok:true},{c:'Either the manager or the employees had to attend.',ok:false},{c:'Either the manager or the employees is to attend.',ok:false},{c:'Neither the manager nor the employees have to attend.',ok:false}],
  ex:'"Either … or" — the verb agrees with the nearer subject ("employees" = plural): "have".' },

{ ck:'SC', d:'MEDIUM', py:false,
  q:'Correct the sentence: "Between you and I, this plan is flawed."',
  o:[{c:'Between you and me, this plan is flawed.',ok:true},{c:'Between you and myself, this plan is flawed.',ok:false},{c:'Among you and me, this plan is flawed.',ok:false},{c:'Between you and I, this plan has flaws.',ok:false}],
  ex:'"Between" is a preposition and must be followed by object pronouns: "between you and me".' },

{ ck:'SC', d:'MEDIUM', py:false,
  q:'Correct the sentence: "Despite of her best efforts, she failed the exam."',
  o:[{c:'Despite her best efforts, she failed the exam.',ok:true},{c:'Despite of her best efforts, she has failed.',ok:false},{c:'Inspite her best efforts, she failed.',ok:false},{c:'Despite her efforts, she has failed the exam.',ok:false}],
  ex:'"Despite" is a preposition used without "of". "Despite of" is incorrect; "in spite of" is the correct two-word form.' },

{ ck:'SC', d:'MEDIUM', py:true,
  q:'Correct the sentence: "He is a coward to run away from the problem."',
  o:[{c:'It is cowardly of him to run away from the problem.',ok:true},{c:'He is cowardly to run away from the problem.',ok:false},{c:'He was coward enough to run away.',ok:false},{c:'He showed coward to run away from the problem.',ok:false}],
  ex:'"It is + adjective + of + person + to + infinitive" is the correct construction for character judgements.' },

{ ck:'SC', d:'HARD', py:true,
  q:'Correct the sentence: "The reason why he failed is because he didn\'t study."',
  o:[{c:'The reason why he failed is that he didn\'t study.',ok:true},{c:'The reason for his failure is because he didn\'t study.',ok:false},{c:'He failed for the reason that because he didn\'t study.',ok:false},{c:'No correction needed.',ok:false}],
  ex:'"Reason is because" is redundant. The correct construction is "The reason … is that …".' },

{ ck:'SC', d:'HARD', py:false,
  q:'Correct the sentence: "Having finished the report, the manager was presented to him for review."',
  o:[{c:'Having finished the report, he presented it to the manager for review.',ok:true},{c:'The manager, having finished the report, was presented it.',ok:false},{c:'The manager received the finished report for review.',ok:false},{c:'The report was presented to the manager having finished.',ok:false}],
  ex:'The dangling participle "Having finished" must logically modify the subject who finished: "he" presented it.' },

{ ck:'SC', d:'HARD', py:false,
  q:'Correct the sentence: "The amount of students in the class has increased."',
  o:[{c:'The number of students in the class has increased.',ok:true},{c:'The amount of students in the class have increased.',ok:false},{c:'The number of students in the class have increased.',ok:false},{c:'An amount of students in the class has increased.',ok:false}],
  ex:'"Amount" is used with uncountable nouns; "number" is used with countable nouns like "students".' },

{ ck:'SC', d:'HARD', py:true,
  q:'Correct the sentence: "I found the keys which were missing laying on the table."',
  o:[{c:'I found the keys which were missing lying on the table.',ok:true},{c:'I found the keys which were missing laid on the table.',ok:false},{c:'I found the keys which were missing layed on the table.',ok:false},{c:'No correction needed.',ok:false}],
  ex:'"Lying" (intransitive, to be in a position) is correct here; "laying" (transitive, to place something) requires an object.' },

{ ck:'SC', d:'EXPERT', py:false,
  q:'Correct the sentence: "Scarcely she had sat down when the phone rang."',
  o:[{c:'Scarcely had she sat down when the phone rang.',ok:true},{c:'Scarcely did she sit down when the phone rang.',ok:false},{c:'Scarcely she sat down than the phone rang.',ok:false},{c:'Scarcely had she sat down than the phone rang.',ok:false}],
  ex:'"Scarcely had + subject + past participle + when" is the correct inverted structure.' },

{ ck:'SC', d:'EXPERT', py:true,
  q:'Correct the sentence: "It is important that every citizen exercised their right to vote."',
  o:[{c:'It is important that every citizen exercise their right to vote.',ok:true},{c:'It is important for every citizen to have exercised their right.',ok:false},{c:'It was important that every citizen exercises their right.',ok:false},{c:'It is important that every citizen will exercise their right.',ok:false}],
  ex:'After "important that", the subjunctive (base form "exercise", not "exercised"/"exercises") is required.' },

{ ck:'SC', d:'EXPERT', py:false,
  q:'Correct the sentence: "No sooner the clock struck midnight than the party ended."',
  o:[{c:'No sooner had the clock struck midnight than the party ended.',ok:true},{c:'No sooner did the clock strike midnight when the party ended.',ok:false},{c:'No sooner had the clock stroke midnight than the party ended.',ok:false},{c:'No sooner when the clock struck midnight than the party ended.',ok:false}],
  ex:'"No sooner had + subject + V3 + than" is the correct structure; inversion after "no sooner" is mandatory.' },

{ ck:'SC', d:'EXPERT', py:false,
  q:'Correct the sentence: "He suggested me to apply for the scholarship."',
  o:[{c:'He suggested that I apply for the scholarship.',ok:true},{c:'He suggested me applying for the scholarship.',ok:false},{c:'He suggested to me to apply for the scholarship.',ok:false},{c:'He suggested me that I apply for the scholarship.',ok:false}],
  ex:'"Suggest" cannot be followed by "someone + to-infinitive". Correct: "suggest that + subject + subjunctive".' },

];

// ─── REST API helpers ─────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function lookupSubjectId(slug: string): Promise<string> {
  const res = await fetch(`${BASE}/api/seed/lookup?type=subjects`, {
    headers: { 'Authorization': `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`[lookup subjects] HTTP ${res.status}`);
  const json = await res.json() as { data: { id: string; slug: string; name: string }[] };
  const subject = json.data.find(s => s.slug === slug);
  if (!subject) throw new Error(`Subject with slug "${slug}" not found on server.`);
  console.log(`  Subject: ${subject.name} (${subject.id})\n`);
  return subject.id;
}

async function upsertTopics(
  subjectId: string,
  chapters: typeof CHAPTERS,
): Promise<Record<string, string>> {
  const payload = chapters.map(ch => ({
    name: ch.name,
    subjectId,
    parentId: null,
    description: ch.desc,
    order: ch.order,
    isActive: true,
  }));

  const res = await fetch(`${BASE}/api/seed/topics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[seed/topics] HTTP ${res.status}: ${text}`);
  }
  const json = await res.json() as {
    data: ({ index: number; id: string; name: string; existing: boolean })[];
    meta: { total: number; created: number; existing: number };
  };

  const T: Record<string, string> = {};
  for (const item of json.data) {
    const ch = chapters[item.index];
    T[ch.key] = item.id;
    const status = item.existing ? '⏭  SKIP ' : '✅ CREATE';
    console.log(`  ${status} [${ch.name}] → ${item.id}`);
  }
  console.log(`\n  Topics: ${json.meta.created} created, ${json.meta.existing} already existed.\n`);
  return T;
}

async function createMCQ(subjectId: string, topicId: string, q: Q): Promise<'created'|'existing'|'failed'> {
  const body = {
    subjectId,
    topicId,
    examIds: [EXAM_ID],
    questionType: 'SINGLE',
    difficulty: q.d,
    question: q.q,
    options: q.o.map(o => ({ content: o.c, isCorrect: o.ok })),
    explanation: q.ex,
    isPreviousYear: q.py ?? false,
    isActive: true,
    tagIds: [],
    examSectionIds: [],
    difficultyPerExam: {},
  };
  try {
    const res = await fetch(`${BASE}/api/seed/mcqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify(body),
    });
    const json = await res.json() as { meta?: { existing?: boolean }; error?: string };
    if (!res.ok) return 'failed';
    return json.meta?.existing ? 'existing' : 'created';
  } catch {
    return 'failed';
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n══════════════════════════════════════════');
  console.log(' NIMCET General English Seeder');
  console.log('══════════════════════════════════════════\n');

  // ── Phase 1: Resolve subject + upsert topics via API ──────────────────────
  console.log('Phase 1 — Upserting topics (chapters) via API…\n');
  const subjectId = await lookupSubjectId('general-english');
  const T = await upsertTopics(subjectId, CHAPTERS);

  // ── Phase 2: Create MCQs ───────────────────────────────────────────────────
  console.log('Phase 2 — Seeding MCQs via API…\n');
  let created = 0, existing = 0, failed = 0;
  const failures: number[] = [];

  for (let i = 0; i < MCQS.length; i++) {
    const q = MCQS[i];
    const topicId = T[q.ck];
    if (!topicId) { console.warn(`  WARN: no topicId for key "${q.ck}"`); failed++; continue; }

    const result = await createMCQ(subjectId, topicId, q);
    if (result === 'created') created++;
    else if (result === 'existing') existing++;
    else { failed++; failures.push(i + 1); }

    process.stdout.write(
      `\r[${String(i+1).padStart(3)}/${MCQS.length}] ✅ Created: ${created}  ⏭  Existing: ${existing}  ❌ Failed: ${failed}`
    );
    await sleep(120);
  }

  console.log('\n\n─────────────────────────────');
  console.log(`Total   : ${MCQS.length}`);
  console.log(`Created : ${created}`);
  console.log(`Existing: ${existing}`);
  console.log(`Failed  : ${failed}${failures.length ? ` (rows: ${failures.join(', ')})` : ''}`);
  console.log('─────────────────────────────\n');
}

main().catch(console.error);

