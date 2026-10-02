const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const formatMoney = (n) => money.format(n ?? 0);

export const formatDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => new Date(iso).toLocaleDateString(undefined, opts);

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

// Gradient hue per category for products without a photo.
const HUES = { Electronics: 250, Fashion: 330, 'Home & Kitchen': 30, 'Sports & Outdoors': 150, Books: 200, Beauty: 290 };
export const categoryHue = (c) => HUES[c] ?? 260;

export const CATEGORY_EMOJI = { Electronics: '🎧', Fashion: '👟', 'Home & Kitchen': '☕', 'Sports & Outdoors': '⛺', Books: '📚', Beauty: '✨' };
