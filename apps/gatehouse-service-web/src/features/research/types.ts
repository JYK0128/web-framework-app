import { z } from 'zod';

export const providerSchema = z.enum(['openai-compatible', 'anthropic', 'gemini']);
export type Provider = z.infer<typeof providerSchema>;

export type MainLlmConfig = {
  provider: Provider
  apiKey: string
  model: string
  baseUrl: string
};

function asString(val: unknown, fallback = ''): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return fallback;
}

const stringArraySchema = z.preprocess((val) => {
  if (typeof val === 'string') return val.trim() ? [val.trim()] : [];
  if (Array.isArray(val)) {
    return val.map((v) => asString(v).trim()).filter(Boolean);
  }
  return [];
}, z.array(z.string())).default([]);

export const sourceSchema = z.object({
  id: z.preprocess((val) => asString(val), z.string()),
  title: z.preprocess((val) => asString(val, 'Untitled Source'), z.string()),
  url: z.preprocess((val) => asString(val), z.string()),
  publisher: z.string().optional(),
  publishedAt: z.string().optional(),
  excerpt: z.preprocess((val) => asString(val), z.string()),
});

export type Source = z.infer<typeof sourceSchema>;

export const claimSchema = z.object({
  id: z.preprocess((val) => asString(val), z.string()),
  text: z.preprocess((val) => asString(val), z.string()),
  sourceIds: stringArraySchema,
  status: z.preprocess((val) => {
    const valid = ['supported', 'partial', 'unsupported', 'conflict'];
    return typeof val === 'string' && valid.includes(val) ? val : 'partial';
  }, z.enum(['supported', 'partial', 'unsupported', 'conflict'])),
});

export const draftSchema = z.object({
  answerMarkdown: z.preprocess((val) => asString(val), z.string()),
  claims: z.preprocess((val) => (Array.isArray(val) ? val : []), z.array(claimSchema)).default([]),
  sources: z.preprocess((val) => (Array.isArray(val) ? val : []), z.array(sourceSchema)).default([]),
  uncertainty: stringArraySchema,
  warnings: stringArraySchema,
});

export type Draft = z.infer<typeof draftSchema>;

export const critiqueSchema = z.object({
  verdict: z.preprocess((val) => {
    const valid = ['pass', 'revise', 'cannot_verify', 'safety_hold'];
    return typeof val === 'string' && valid.includes(val) ? val : 'pass';
  }, z.enum(['pass', 'revise', 'cannot_verify', 'safety_hold'])),
  scores: z.preprocess((val) => (typeof val === 'object' && val !== null ? val : {}), z.object({
    faithfulness: z.coerce.number().min(0).max(1).default(0.8),
    citationCoverage: z.coerce.number().min(0).max(1).default(0.8),
    sourceQuality: z.coerce.number().min(0).max(1).default(0.8),
    completeness: z.coerce.number().min(0).max(1).default(0.8),
    safety: z.coerce.number().min(0).max(1).default(1.0),
  })).default({ faithfulness: 0.8, citationCoverage: 0.8, sourceQuality: 0.8, completeness: 0.8, safety: 1.0 }),
  issues: z.preprocess((val) => (Array.isArray(val) ? val : []), z.array(z.object({
    claimId: z.string().optional(),
    severity: z.preprocess((s) => (['low', 'medium', 'high'].includes(asString(s)) ? s : 'low'), z.enum(['low', 'medium', 'high'])),
    type: z.preprocess((t) => asString(t, 'general'), z.string()),
    explanation: z.preprocess((e) => asString(e), z.string()),
    action: z.preprocess((a) => (['keep', 'rewrite', 'remove', 'qualify'].includes(asString(a)) ? a : 'rewrite'), z.enum(['keep', 'rewrite', 'remove', 'qualify'])),
  }))).default([]),
  revisionInstructions: stringArraySchema,
  summary: z.preprocess((val) => asString(val, '검증 완료'), z.string()),
});

export type Critique = z.infer<typeof critiqueSchema>;

export type ConversationStep = {
  kind: 'main' | 'gemma'
  round: number
  title: string
  body: string
  critique?: Critique
};

export type ResearchResult = {
  question: string
  finalDraft: Draft
  finalCritique: Critique
  steps: ConversationStep[]
  rounds: number
};

export type WorkerStartMessage = {
  type: 'start'
  question: string
  config: MainLlmConfig
  gemmaModelId: string
  maxRevisionRounds: number
};

export type WorkerStopMessage = { type: 'stop' };

export type WorkerMessage = WorkerStartMessage | WorkerStopMessage;

export type WorkerEvent
  = | { type: 'progress', phase: string, message: string, percent: number }
    | { type: 'result', result: ResearchResult }
    | { type: 'error', message: string };
