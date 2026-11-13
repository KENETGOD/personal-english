// shortcut: trim + case-insensitive equality only; T-3.4 replaces this with the tolerant check and suggested grade.
export function checkCardAnswer(expected: string, given: string): boolean {
  return expected.trim().toLowerCase() === given.trim().toLowerCase();
}
