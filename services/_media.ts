/** Group media rows by completion_id into a Map. */
export function groupMediaByCompletion<
  T extends { completion_id: string },
>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const m of rows) {
    const list = map.get(m.completion_id) ?? [];
    list.push(m);
    map.set(m.completion_id, list);
  }
  return map;
}
