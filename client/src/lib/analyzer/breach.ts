// Have I Been Pwned "Pwned Passwords" range API using k-anonymity.
// SHA-1 is used ONLY because the protocol requires it. It is not a password-storage algorithm.
export type BreachResult =
  | { status: 'breached'; count: number }
  | { status: 'safe' }
  | { status: 'error'; reason: 'rate-limited' | 'offline' | 'unavailable' | 'cancelled' };

export async function sha1Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export async function checkBreach(
  password: string,
  opts: { fetchImpl?: typeof fetch; signal?: AbortSignal } = {},
): Promise<BreachResult> {
  const doFetch = opts.fetchImpl ?? fetch;
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5); // ONLY this leaves the browser
  const suffix = hash.slice(5); // compared locally
  try {
    const res = await doFetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: opts.signal,
    });
    if (res.status === 429) return { status: 'error', reason: 'rate-limited' };
    if (!res.ok) return { status: 'error', reason: 'unavailable' };
    for (const line of (await res.text()).split(/\r?\n/)) {
      const [s, c] = line.split(':');
      if (s?.trim().toUpperCase() === suffix) {
        const count = parseInt(c, 10) || 0;
        if (count > 0) return { status: 'breached', count }; // padded entries have count 0
      }
    }
    return { status: 'safe' };
  } catch (e) {
    if ((e as Error).name === 'AbortError') return { status: 'error', reason: 'cancelled' };
    return { status: 'error', reason: navigator.onLine === false ? 'offline' : 'unavailable' };
  }
}
