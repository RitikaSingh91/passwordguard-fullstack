// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { analyzePassword, humanTime } from './index';
import { checkBreach, sha1Hex } from './breach';
import { detectPatterns } from './patterns';

describe('analyzePassword', () => {
  it('rates common passwords as weak', () => {
    expect(analyzePassword('password123').score).toBeLessThan(30);
    expect(analyzePassword('qwerty').category).toBe('Very weak');
  });
  it('rates a long random passphrase as strong', () => {
    expect(analyzePassword('correct-horse-battery-staple-9Lk!').score).toBeGreaterThan(70);
  });
  it('returns four attack scenarios in increasing speed', () => {
    const t = analyzePassword('Tr0ub4dor&3').attackTimes;
    expect(t).toHaveLength(4);
    expect(t[0].seconds).toBeGreaterThan(t[3].seconds);
  });
  it('handles empty input', () => {
    expect(analyzePassword('').score).toBe(0);
  });
  it('uses personal words only when supplied', () => {
    expect(detectPatterns('Rahul2024!x9').some((p) => p.type === 'personal')).toBe(false);
    expect(detectPatterns('Rahul2024!x9', ['rahul']).some((p) => p.type === 'personal')).toBe(true);
  });
});

describe('detectPatterns', () => {
  it('finds keyboard walks, years, sequences and leetspeak', () => {
    const types = detectPatterns('qwerty1234').map((p) => p.type);
    expect(types).toContain('keyboard');
    expect(types).toContain('sequence');
    expect(detectPatterns('Summer2023').map((p) => p.type)).toContain('year');
    expect(detectPatterns('p@ssw0rd').map((p) => p.type)).toContain('leetspeak');
  });
  it('finds repeated characters', () => {
    expect(detectPatterns('aaaa').map((p) => p.type)).toContain('repeat');
  });
});

describe('humanTime', () => {
  it('formats durations', () => {
    expect(humanTime(0.1)).toBe('instantly');
    expect(humanTime(120)).toBe('2 minutes');
  });
});

describe('checkBreach (k-anonymity)', () => {
  it('sends only a 5-char prefix and matches the suffix locally', async () => {
    const hash = await sha1Hex('password');
    expect(hash).toBe('5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8');
    const fetchImpl = vi.fn(async () => new Response(`0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n${hash.slice(5)}:9545824\r\n`));
    const r = await checkBreach('password', { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toEqual({ status: 'breached', count: 9545824 });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.pwnedpasswords.com/range/5BAA6');
    expect(url).not.toContain(hash.slice(5));
    expect(JSON.stringify(init)).not.toContain('password');
  });
  it('treats padded zero-count entries as not breached', async () => {
    const hash = await sha1Hex('zz-unique-pw-1');
    const fetchImpl = vi.fn(async () => new Response(`${hash.slice(5)}:0\r\n`));
    expect((await checkBreach('zz-unique-pw-1', { fetchImpl: fetchImpl as unknown as typeof fetch })).status).toBe('safe');
  });
  it('handles rate limits and network failures gracefully', async () => {
    const limited = vi.fn(async () => new Response('', { status: 429 }));
    expect(await checkBreach('x', { fetchImpl: limited as unknown as typeof fetch })).toEqual({ status: 'error', reason: 'rate-limited' });
    const down = vi.fn(async () => { throw new TypeError('network'); });
    expect((await checkBreach('x', { fetchImpl: down as unknown as typeof fetch })).status).toBe('error');
  });
});