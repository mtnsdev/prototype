export type KvAccessAuditEntry = {
  id: string;
  at: string;
  docId: string;
  docTitle: string;
  actorLabel: string;
  fromScope: string;
  toScope: string;
};

const MAX = 80;
const entries: KvAccessAuditEntry[] = [];
const subs = new Set<() => void>();

function notify() {
  for (const cb of subs) cb();
}

export function subscribeKvAccessAudit(onStoreChange: () => void): () => void {
  subs.add(onStoreChange);
  return () => subs.delete(onStoreChange);
}

export function getKvAccessAuditSnapshot(): KvAccessAuditEntry[] {
  return entries;
}

export function recordKvAccessAudit(args: {
  docId: string;
  docTitle: string;
  actorLabel: string;
  fromScope: string;
  toScope: string;
}): void {
  entries.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: new Date().toISOString(),
    docId: args.docId,
    docTitle: args.docTitle,
    actorLabel: args.actorLabel,
    fromScope: args.fromScope,
    toScope: args.toScope,
  });
  if (entries.length > MAX) entries.length = MAX;
  notify();
}
