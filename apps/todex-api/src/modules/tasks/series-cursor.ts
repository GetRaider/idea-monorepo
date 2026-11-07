export interface DueCandidate {
  localKey: string;
  anchor: Date;
}

export function satisfiedPrefix(
  candidates: DueCandidate[],
  isSatisfied: (candidate: DueCandidate) => boolean,
): string | null {
  let through: string | null = null;
  for (const candidate of candidates) {
    if (!isSatisfied(candidate)) break;
    through = candidate.localKey;
  }
  return through;
}

export function unsatisfiedDue(
  candidates: DueCandidate[],
  isSatisfied: (candidate: DueCandidate) => boolean,
  limit: number,
): DueCandidate[] {
  const pending: DueCandidate[] = [];
  for (const candidate of candidates) {
    if (isSatisfied(candidate)) continue;
    pending.push(candidate);
    if (pending.length >= limit) break;
  }
  return pending;
}
