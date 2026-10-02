import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { MAX_QTY_PER_ITEM, SHIPPING } from '../config/store.js';
import { fromCents } from '../utils/money.js';

export function shippingFor(subtotalCents) {
  if (subtotalCents === 0) return 0;
  return subtotalCents >= SHIPPING.freeOverCents ? 0 : SHIPPING.flatCents;
}

async function loadCart(userId) {
  return (await Cart.findOne({ user: userId })) ?? new Cart({ user: userId, items: [] });
}

// Builds the cart response from live product data. Removes items that no longer exist or are hidden,
// and lowers quantities that exceed current stock, reporting each change as a warning.
export async function cartView(cart) {
  const ids = cart.items.map((i) => i.product);
  const products = new Map((await Product.find({ _id: { $in: ids } })).map((p) => [p.id, p]));
  const warnings = [];
  const kept = [];
  const items = [];

  for (const item of cart.items) {
    const p = products.get(item.product.toString());
    if (!p || !p.active) {
      warnings.push(`An item in your cart is no longer available and was removed.`);
      continue;
    }
    if (p.stock === 0) {
      warnings.push(`${p.name} is out of stock and was removed.`);
      continue;
    }
    let { qty } = item;
    if (qty > p.stock) {
      qty = p.stock;
      warnings.push(`Only ${p.stock} of ${p.name} left — quantity updated.`);
    }
    kept.push({ product: p._id, qty });
    items.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      emoji: p.emoji,
      image: p.image,
      price: fromCents(p.priceCents),
      qty,
      stock: p.stock,
      lineTotal: fromCents(p.priceCents * qty),
      _cents: p.priceCents * qty,
    });
  }

  if (warnings.length && !cart.isNew) {
    cart.items = kept;
    await cart.save();
  }

  const subtotal = items.reduce((s, i) => s + i._cents, 0);
  const shipping = shippingFor(subtotal);
  return {
    items: items.map(({ _cents, ...i }) => i),
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: fromCents(subtotal),
    shipping: fromCents(shipping),
    total: fromCents(subtotal + shipping),
    freeShippingOver: fromCents(SHIPPING.freeOverCents),
    warnings,
  };
}

async function addQty(cart, productId, qty) {
  const p = await Product.findOne({ _id: productId, active: true });
  if (!p) return { error: [404, 'Product not found'] };
  const existing = cart.items.find((i) => i.product.toString() === productId);
  const limit = Math.min(p.stock, MAX_QTY_PER_ITEM);
  const next = (existing?.qty ?? 0) + qty;
  if (limit === 0) return { error: [409, `${p.name} is out of stock`] };
  if (next > limit) return { error: [409, `You can add at most ${limit} of ${p.name}`] };
  if (existing) existing.qty = next;
  else cart.items.push({ product: p._id, qty });
  return {};
}

export async function getCart(req, res) {
  res.json(await cartView(await loadCart(req.user._id)));
}

// POST /api/cart/items { productId, qty }
export async function addItem(req, res) {
  const cart = await loadCart(req.user._id);
  const { error } = await addQty(cart, req.body.productId, req.body.qty ?? 1);
  if (error) return res.status(error[0]).json({ message: error[1] });
  await cart.save();
  return res.status(201).json(await cartView(cart));
}

// PUT /api/cart/items/:productId { qty }
export async function setItemQty(req, res) {
  const cart = await loadCart(req.user._id);
  const item = cart.items.find((i) => i.product.toString() === req.params.productId);
  if (!item) return res.status(404).json({ message: 'Item is not in your cart' });
  const p = await Product.findById(req.params.productId);
  const limit = Math.min(p?.stock ?? 0, MAX_QTY_PER_ITEM);
  if (req.body.qty > limit) return res.status(409).json({ message: `Only ${limit} available` });
  item.qty = req.body.qty;
  await cart.save();
  return res.json(await cartView(cart));
}

// DELETE /api/cart/items/:productId
export async function removeItem(req, res) {
  const cart = await loadCart(req.user._id);
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  if (!cart.isNew) await cart.save();
  res.json(await cartView(cart));
}

// DELETE /api/cart
export async function clearCart(req, res) {
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
  res.json(await cartView(new Cart({ user: req.user._id, items: [] })));
}

// POST /api/cart/merge { items: [{ productId, qty }] } — merges a guest cart after login.
// Quantities are capped to what's available instead of failing.
export async function mergeCart(req, res) {
  const cart = await loadCart(req.user._id);
  const products = new Map(
    (await Product.find({ _id: { $in: req.body.items.map((i) => i.productId) }, active: true })).map((p) => [p.id, p])
  );
  for (const { productId, qty } of req.body.items) {
    const p = products.get(productId);
    if (!p) continue;
    const existing = cart.items.find((i) => i.product.toString() === productId);
    const capped = Math.min((existing?.qty ?? 0) + qty, p.stock, MAX_QTY_PER_ITEM);
    if (capped <= 0) continue;
    if (existing) existing.qty = capped;
    else cart.items.push({ product: p._id, qty: capped });
  }
  await cart.save();
  res.json(await cartView(cart));
}
