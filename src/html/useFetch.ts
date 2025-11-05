import { useEffect, useState } from "preact/hooks";

export default function useFetch<T>(fetcher: () => Promise<T>) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await fetcher();
      setData(response);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [fetcher]);
  return { loading, data, error };
}
