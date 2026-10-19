import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import * as common from '@zxcvbn-ts/language-common';
import * as en from '@zxcvbn-ts/language-en';
import { ATTACK_SCENARIOS, CATEGORIES, MAX_ANALYZED_LENGTH, MAX_LOG10_GUESSES } from './config';
import { detectPatterns, DetectedPattern } from './patterns';

const estimator = new ZxcvbnFactory({
  translations: en.translations,
  graphs: common.adjacencyGraphs,
  dictionary: { ...common.dictionary, ...en.dictionary },
});

export type Category = 'Very weak' | 'Weak' | 'Fair' | 'Strong' | 'Very strong';

export interface AttackTime { id: string; label: string; note: string; seconds: number; human: string }
export interface AnalysisResult {
  length: number;
  score: number; // 0-100 display score
  zxcvbnScore: 0 | 1 | 2 | 3 | 4; // raw estimator score for reference
  category: Category;
  guesses: number;
  guessesLog10: number;
  attackTimes: AttackTime[];
  patterns: DetectedPattern[];
  warning: string;
  suggestions: string[];
  checklist: { label: string; pass: boolean }[];
}

export function humanTime(seconds: number): string {
  if (seconds < 1) return 'instantly';
  const units: [string, number][] = [['centuries', 3.15e9], ['years', 3.15e7], ['days', 86400], ['hours', 3600], ['minutes', 60], ['seconds', 1]];
  if (seconds >= 3.15e11) return 'more than 100 centuries';
  for (const [name, size] of units) if (seconds >= size) return `${Math.round(seconds / size).toLocaleString()} ${name}`;
  return 'instantly';
}

export function categoryFor(score: number): Category {
  return CATEGORIES.find((c) => score < c.max)!.name as Category;
}

export function analyzePassword(password: string, personalWords: string[] = []): AnalysisResult {
  const pw = password.slice(0, MAX_ANALYZED_LENGTH);
  const patterns = detectPatterns(pw, personalWords);
  const checklist = [
    { label: 'At least 12 characters', pass: pw.length >= 12 },
    { label: 'Upper and lower case letters', pass: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
    { label: 'Includes a number', pass: /\d/.test(pw) },
    { label: 'Includes a symbol', pass: /[^A-Za-z0-9]/.test(pw) },
    { label: 'No predictable patterns found', pass: pw.length > 0 && patterns.length === 0 },
  ];
  if (!pw) {
    return { length: 0, score: 0, zxcvbnScore: 0, category: 'Very weak', guesses: 0, guessesLog10: 0,
      attackTimes: [], patterns: [], warning: '', suggestions: [], checklist };
  }
  const r = estimator.check(pw, personalWords);
  const guessesLog10 = Math.max(0, r.guessesLog10);
  const score = Math.max(0, Math.min(100, Math.round((guessesLog10 / MAX_LOG10_GUESSES) * 100)));
  const suggestions = [...r.feedback.suggestions];
  if (pw.length < 12) suggestions.push('Use at least 12 characters; length helps more than complexity.');
  if (patterns.length) suggestions.push('Avoid the predictable patterns listed, or add unrelated random words.');
  suggestions.push('Use a unique password for every account and store them in a password manager.');
  return {
    length: pw.length,
    score,
    zxcvbnScore: r.score,
    category: categoryFor(score),
    guesses: r.guesses,
    guessesLog10,
    // Average case: an attacker finds the password about halfway through the guesses.
    attackTimes: ATTACK_SCENARIOS.map((s) => {
      const seconds = r.guesses / 2 / s.rate;
      return { id: s.id, label: s.label, note: s.note, seconds, human: humanTime(seconds) };
    }),
    patterns,
    warning: r.feedback.warning ?? '',
    suggestions: [...new Set(suggestions)],
    checklist,
  };
}
