export type PatternType =
  | 'dictionary' | 'keyboard' | 'sequence' | 'repeat' | 'repeat-chunk' | 'date' | 'year'
  | 'suffix' | 'prefix' | 'capitalization' | 'leetspeak' | 'personal';
export interface DetectedPattern { type: PatternType; label: string }

const WORDS = ['password','passwd','welcome','admin','login','letmein','monkey','dragon','football','baseball','iloveyou','master','sunshine','princess','qwerty','hello','summer','winter','india','cricket','secret','shadow','superman','batman','freedom','whatever','trustno','computer','internet','michael','jordan','charlie'];
const WALKS = ['qwerty','qwertyuiop','asdf','asdfgh','zxcv','zxcvbn','qazwsx','1qaz2wsx','1q2w3e','poiuy','lkjhg'];
const LEET: Record<string, string> = { '@': 'a', '4': 'a', '0': 'o', '3': 'e', '1': 'i', '!': 'i', $: 's', '5': 's', '7': 't' };

export const deLeet = (s: string) => [...s.toLowerCase()].map((c) => LEET[c] ?? c).join('');

export function detectPatterns(pw: string, personal: string[] = []): DetectedPattern[] {
  const out: DetectedPattern[] = [];
  if (!pw) return out;
  const low = pw.toLowerCase();
  const plain = deLeet(pw);
  const add = (type: PatternType, label: string) => out.push({ type, label });

  const words = WORDS.filter((w) => plain.includes(w));
  words.forEach((w) => add('dictionary', `Common word: “${w}”`));
  if (words.length && plain !== low) add('leetspeak', 'Predictable character substitutions (e.g. @ for a, 0 for o)');
  WALKS.filter((w) => low.includes(w)).forEach((w) => add('keyboard', `Keyboard pattern: “${w}”`));
  if (/(.)\1{2,}/.test(pw)) add('repeat', 'Repeated characters (e.g. aaa)');
  if (/^(.{2,6})\1+$/.test(pw)) add('repeat-chunk', 'The same chunk repeated');
  if (/(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|abcd|bcde|cdef|defg)/.test(low)) add('sequence', 'Sequential characters (e.g. 1234, abcd)');
  if (/(19|20)\d{2}$/.test(pw)) add('year', 'Ends with a year');
  if (/\b(0[1-9]|[12]\d|3[01])[/.-]?(0[1-9]|1[0-2])[/.-]?((19|20)?\d{2})\b/.test(pw)) add('date', 'Looks like a date');
  if (/[a-z]{3,}[!@#$%?.]{1,2}\d{0,4}$/i.test(pw) && pw.length < 16) add('suffix', 'Predictable ending (e.g. “!”, “123”)');
  if (/^\d{1,4}[a-z]{3,}/i.test(pw)) add('prefix', 'Starts with predictable digits');
  if (/^[A-Z][a-z]+[\d!@#$]*$/.test(pw)) add('capitalization', 'Only the first letter is capitalized');
  personal
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length >= 3 && plain.includes(deLeet(p)))
    .forEach(() => add('personal', 'Contains personal information you provided'));
  return out;
}
