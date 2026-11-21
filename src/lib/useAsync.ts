import { useCallback, useEffect, useRef, useState } from 'react';

/** Tai du lieu bat dong bo, tu huy ket qua cu khi deps thay doi. */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(loader, deps);

  const reload = useCallback(
    async (silent = false) => {
      const id = ++seq.current;
      if (!silent) setLoading(true);
      try {
        const result = await load();
        if (id === seq.current) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (id === seq.current) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (id === seq.current) setLoading(false);
      }
    },
    [load],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, setData, error, loading, reload };
}
