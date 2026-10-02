import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import { CATEGORIES } from '../config/store.js';
import { toCents } from '../utils/money.js';
import { uniqueSlug } from '../utils/slug.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isAdmin = (req) => req.user?.role === 'admin';

const SORTS = {
  newest: { createdAt: -1 },
  'price-asc': { priceCents: 1 },
  'price-desc': { priceCents: -1 },
  name: { name: 1 },
  stock: { stock: 1 },
};

// GET /api/products — public catalog. Admins can pass ?all=true to include hidden products.
export async function listProducts(req, res) {
  const { search = '', category, minPrice, maxPrice, inStock, featured, sort = 'newest', page = 1, limit = 12 } = req.query;
  const filter = {};
  if (!(isAdmin(req) && req.query.all === 'true')) filter.active = true;
  if (search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { description: rx }];
  }
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.priceCents = {};
    if (minPrice) filter.priceCents.$gte = toCents(minPrice);
    if (maxPrice) filter.priceCents.$lte = toCents(maxPrice);
  }
  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (featured === 'true') filter.featured = true;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  // Category counts follow the search/price/stock filters but ignore the selected category and the featured flag.
  const { category: _c, featured: _f, ...facetFilter } = filter;

  const [items, total, counts] = await Promise.all([
    Product.find(filter).sort({ ...SORTS[sort], _id: 1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Product.countDocuments(filter),
    Product.aggregate([{ $match: facetFilter }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);

  res.json({
    data: items,
    categories: CATEGORIES.map((c) => ({ name: c, count: counts.find((x) => x._id === c)?.count ?? 0 })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.max(1, Math.ceil(total / limitNum)) },
  });
}

// GET /api/products/:idOrSlug — product page with related items.
export async function getProduct(req, res) {
  const key = req.params.idOrSlug;
  const filter = mongoose.isValidObjectId(key) ? { _id: key } : { slug: key.toLowerCase() };
  if (!isAdmin(req)) filter.active = true;
  const product = await Product.findOne(filter);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const related = await Product.find({ category: product.category, active: true, _id: { $ne: product._id } })
    .sort({ featured: -1, createdAt: -1 })
    .limit(4);
  return res.json({ product, related });
}

function applyBody(p, body) {
  for (const k of ['name', 'description', 'category', 'brand', 'image', 'emoji', 'stock', 'featured', 'active']) {
    if (body[k] !== undefined) p[k] = body[k];
  }
  if (body.price !== undefined) p.priceCents = toCents(body.price);
  if (body.compareAtPrice !== undefined) p.compareAtCents = body.compareAtPrice === '' || body.compareAtPrice === null ? null : toCents(body.compareAtPrice);
}

function checkCompareAt(p, res) {
  if (p.compareAtCents && p.compareAtCents <= p.priceCents) {
    res.status(400).json({ message: 'Validation failed', errors: { compareAtPrice: 'Compare-at price must be higher than the price' } });
    return false;
  }
  return true;
}

// POST /api/products (admin)
export async function createProduct(req, res) {
  const p = new Product();
  applyBody(p, req.body);
  if (!checkCompareAt(p, res)) return undefined;
  p.slug = await uniqueSlug(p.name);
  await p.save();
  return res.status(201).json(p);
}

// PUT /api/products/:id (admin)
export async function updateProduct(req, res) {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Product not found' });
  const renamed = req.body.name !== undefined && req.body.name !== p.name;
  applyBody(p, req.body);
  if (!checkCompareAt(p, res)) return undefined;
  if (renamed) p.slug = await uniqueSlug(p.name, p._id);
  await p.save();
  return res.json(p);
}

// DELETE /api/products/:id (admin). Past orders keep their item snapshots; carts drop the product.
export async function deleteProduct(req, res) {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) return res.status(404).json({ message: 'Product not found' });
  await Cart.updateMany({}, { $pull: { items: { product: p._id } } });
  return res.json({ message: 'Product deleted', id: p.id });
}
