// Centralized attack-rate assumptions (guesses per second). These are ILLUSTRATIVE.
// Real speed depends on attacker hardware, strategy, the hash algorithm and any rate limiting.
export const ATTACK_SCENARIOS = [
  { id: 'online-throttled', label: 'Online, throttled', rate: 100 / 3600, note: '~100 guesses per hour (strict lockouts)' },
  { id: 'online-unthrottled', label: 'Online, unthrottled', rate: 10, note: '~10 guesses per second' },
  { id: 'offline-slow', label: 'Offline, slow hash', rate: 1e4, note: '~10,000/s against bcrypt/Argon2-class hashes' },
  { id: 'offline-fast', label: 'Offline, fast hash', rate: 1e10, note: '~10 billion/s against unsalted fast hashes on GPUs' },
] as const;

// Documented score mapping: displayScore = clamp(round(log10(guesses) / 14 * 100), 0, 100).
// 14 orders of magnitude (~10^14 guesses) is treated as "fully strong" for this tool.
export const MAX_LOG10_GUESSES = 14;

export const CATEGORIES = [
  { max: 20, name: 'Very weak' },
  { max: 40, name: 'Weak' },
  { max: 60, name: 'Fair' },
  { max: 80, name: 'Strong' },
  { max: 101, name: 'Very strong' },
] as const;

export const MAX_ANALYZED_LENGTH = 256; // keeps the estimator fast on huge inputs
