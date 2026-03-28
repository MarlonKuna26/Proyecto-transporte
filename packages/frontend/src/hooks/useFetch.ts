/**
 * Hook: useFetch
 * Fetching genérico para APIs
 */

import { useState, useEffect, useCallback } from 'react';

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useFetch = <T,>(url: string) => {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        setState({ data: json, loading: false, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Fetch failed';
        setState({ data: null, loading: false, error: message });
      }
    };

    fetchData();
  }, [url]);

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      setState({ data: json, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fetch failed';
      setState({ data: null, loading: false, error: message });
    }
  }, [url]);

  return { ...state, refetch };
};
