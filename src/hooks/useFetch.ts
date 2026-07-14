import { useCallback, useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "../services/api-errors";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
) {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: true, error: null });
  const mountedRef = useRef(true);

  const run = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcher();
      if (mountedRef.current) setState({ data, loading: false, error: null });
    } catch (err) {
      if (mountedRef.current)
        setState({ data: null, loading: false, error: getApiErrorMessage(err, "Failed to load") });
    }
  // `deps` is intentionally a caller-supplied array, not a literal — that's
  // the whole point of this generic hook's API (mirrors useCallback/useEffect
  // deps for the wrapped fetcher). Not expressible as a literal by design.
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    run();
    return () => { mountedRef.current = false; };
  }, [run]);

  return { ...state, refresh: run };
}

export function useAsync<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (...args: TArgs): Promise<TResult | null> => {
    setPending(true);
    setError(null);
    try {
      const result = await action(...args);
      return result;
    } catch (err) {
      const msg = getApiErrorMessage(err, "Action failed");
      setError(msg);
      return null;
    } finally {
      setPending(false);
    }
  };

  return { execute, pending, error };
}
