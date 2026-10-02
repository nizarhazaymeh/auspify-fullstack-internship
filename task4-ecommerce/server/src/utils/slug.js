import Product from '../models/Product.js';

export const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'product';

// Returns a slug not used by any other product (appends -2, -3, … when needed).
export async function uniqueSlug(name, excludeId) {
  const base = slugify(name);
  let slug = base;
  for (let n = 2; await Product.exists({ slug, _id: { $ne: excludeId } }); n += 1) slug = `${base}-${n}`;
  return slug;
}
