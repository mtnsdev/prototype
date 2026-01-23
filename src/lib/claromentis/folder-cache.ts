type CacheEntry<T> = {
    expiresAt: number;
    value: T;
};

const TTL_MS = 15 * 60 * 1000;

// per-server-instance cache
const cache = new Map<string, CacheEntry<unknown>>();

// to dedupe concurrent requests for same key
const inflight = new Map<string, Promise<unknown>>();

export function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }

    return entry.value as T;
}

export function setCached<T>(key: string, value: T) {
    cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

export function getInflight<T>(key: string): Promise<T> | null {
    return (inflight.get(key) as Promise<T>) ?? null;
}

export function setInflight<T>(key: string, p: Promise<T>) {
    inflight.set(key, p);
    p.finally(() => inflight.delete(key));
}
