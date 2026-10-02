import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cartApi } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';
import { useMeta } from '../hooks/useMeta.js';

const CartContext = createContext(null);
const KEY = 'guest-cart-v1';
const empty = { items: [], count: 0, subtotal: 0, shipping: 0, total: 0, warnings: [] };

function readGuest() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function writeGuest(items) {
  try {
    if (items.length) localStorage.setItem(KEY, JSON.stringify(items));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: guest cart lives in memory only */
  }
}

const round = (n) => Math.round(n * 100) / 100;

// Guests keep a cart in this browser (prices shown are indicative; the server re-prices at checkout).
// Signed-in users use the server cart. Logging in merges the guest cart into the account.
export function CartProvider({ children }) {
  const { user, checking } = useAuth();
  const { shipping: rules, maxQtyPerItem } = useMeta();
  const [serverCart, setServerCart] = useState(empty);
  const [guestItems, setGuestItems] = useState(readGuest);
  const [loading, setLoading] = useState(false);
  const mergedFor = useRef(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setServerCart(await cartApi.get());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (checking) return;
    if (!user) {
      mergedFor.current = null;
      setServerCart(empty);
      return;
    }
    if (mergedFor.current === user.id) return;
    mergedFor.current = user.id;
    const guest = readGuest();
    setLoading(true);
    (guest.length ? cartApi.merge(guest.map(({ productId, qty }) => ({ productId, qty }))) : cartApi.get())
      .then((c) => {
        setServerCart(c);
        writeGuest([]);
        setGuestItems([]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, checking]);

  const guestCart = useMemo(() => {
    const subtotal = round(guestItems.reduce((s, i) => s + i.price * i.qty, 0));
    const shipping = subtotal === 0 || subtotal >= rules.freeOver ? 0 : rules.flat;
    return {
      items: guestItems.map((i) => ({ ...i, lineTotal: round(i.price * i.qty) })),
      count: guestItems.reduce((n, i) => n + i.qty, 0),
      subtotal,
      shipping,
      total: round(subtotal + shipping),
      freeShippingOver: rules.freeOver,
      warnings: [],
    };
  }, [guestItems, rules]);

  const updateGuest = (fn) =>
    setGuestItems((prev) => {
      const next = fn(prev);
      writeGuest(next);
      return next;
    });

  // product: full product object from the API.
  const add = useCallback(
    async (product, qty = 1) => {
      if (user) {
        setServerCart(await cartApi.add(product.id, qty));
        return;
      }
      const existing = guestItems.find((i) => i.productId === product.id);
      const limit = Math.min(product.stock, maxQtyPerItem);
      if ((existing?.qty ?? 0) + qty > limit) throw new Error(`You can add at most ${limit} of ${product.name}`);
      updateGuest((prev) =>
        existing
          ? prev.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + qty } : i))
          : [...prev, { productId: product.id, slug: product.slug, name: product.name, emoji: product.emoji, image: product.image, price: product.price, stock: product.stock, qty }]
      );
    },
    [user, guestItems, maxQtyPerItem]
  );

  const setQty = useCallback(
    async (productId, qty) => {
      if (user) setServerCart(await cartApi.setQty(productId, qty));
      else updateGuest((prev) => prev.map((i) => (i.productId === productId ? { ...i, qty: Math.min(qty, i.stock, maxQtyPerItem) } : i)));
    },
    [user, maxQtyPerItem]
  );

  const remove = useCallback(
    async (productId) => {
      if (user) setServerCart(await cartApi.remove(productId));
      else updateGuest((prev) => prev.filter((i) => i.productId !== productId));
    },
    [user]
  );

  const cart = user ? serverCart : guestCart;
  const value = useMemo(
    () => ({ ...cart, loading, add, setQty, remove, refresh, setServerCart, maxQtyPerItem }),
    [cart, loading, add, setQty, remove, refresh, maxQtyPerItem]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
