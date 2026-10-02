import { useEffect, useState } from 'react';
import { studentsApi } from '../api/students.js';

const fallback = { courses: [], genders: ['Male', 'Female'] };
let cache = null;

// Allowed course / gender values come from the API so the UI and model never drift apart.
export function useMeta() {
  const [meta, setMeta] = useState(cache ?? fallback);
  useEffect(() => {
    if (cache) return undefined;
    const ctrl = new AbortController();
    studentsApi
      .meta(ctrl.signal)
      .then((m) => {
        cache = m;
        setMeta(m);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);
  return meta;
}
