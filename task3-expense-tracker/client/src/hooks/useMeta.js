import { useEffect, useState } from 'react';
import { metaApi } from '../api/client.js';

const fallback = { categories: { income: [], expense: [] }, currencies: ['USD'], paymentMethods: [] };
let cache = null;

export function useMeta() {
  const [meta, setMeta] = useState(cache ?? fallback);
  useEffect(() => {
    if (cache) return undefined;
    const ctrl = new AbortController();
    metaApi
      .get(ctrl.signal)
      .then((m) => {
        cache = m;
        setMeta(m);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);
  return meta;
}
