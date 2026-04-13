/**
 * Generic paginated Supabase query.
 *
 * `buildQuery` receives `(from, to)` range indices and must return a Supabase
 * response shape `{ data, error }`. The helper loops until all rows are fetched
 * or the result set is exhausted.
 */
export async function paginateQuery<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await buildQuery(offset, offset + pageSize - 1);
    if (error) throw error;
    const chunk = data ?? [];
    if (chunk.length === 0) break;
    all.push(...chunk);
    if (chunk.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}
