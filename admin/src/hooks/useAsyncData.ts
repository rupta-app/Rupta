import { useState, useEffect, useCallback, useRef } from 'react';

interface PaginatedResult<T> {
  data: T[];
  total: number;
}

interface UseAsyncDataReturn<T, TFilters> {
  data: T[];
  total: number;
  loading: boolean;
  error: string | null;
  filters: TFilters;
  page: number;
  setFilters: (filters: TFilters) => void;
  setPage: (page: number) => void;
  refetch: () => void;
}

export function useAsyncData<T, TFilters>(
  fetcher: (params: { page: number; pageSize: number } & TFilters) => Promise<PaginatedResult<T>>,
  initialFilters: TFilters,
  pageSize: number,
): UseAsyncDataReturn<T, TFilters> {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<TFilters>(initialFilters);
  const [page, setPageState] = useState(0);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher({ ...filters, page, pageSize });
      if (mountedRef.current) {
        setData(result.data);
        setTotal(result.total);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetcher, filters, page, pageSize]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  function setFilters(newFilters: TFilters) {
    setFiltersState(newFilters);
    setPageState(0);
  }

  return {
    data,
    total,
    loading,
    error,
    filters,
    page,
    setFilters,
    setPage: setPageState,
    refetch: load,
  };
}
