import { useEffect, useState } from 'react';
import { metaApi } from '../api/client.js';

const fallback = {
  categories: [],
  orderStatuses: [],
  statusFlow: {},
  paymentMethods: ['Cash on Delivery'],
  maxQtyPerItem: 10,
  shipping: { flat: 5, freeOver: 50 },
};
let cache = null;
let inflight = null;

export function useMeta() {
  const [meta, setMeta] = useState(cache ?? fallback);
  useEffect(() => {
    if (cache) return undefined;
    let alive = true;
    inflight ??= metaApi.get().then((m) => (cache = m));
    inflight.then((m) => alive && setMeta(m)).catch(() => {
      inflight = null;
    });
    return () => {
      alive = false;
    };
  }, []);
  return meta;
}
