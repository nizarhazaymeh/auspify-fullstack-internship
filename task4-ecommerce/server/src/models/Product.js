import mongoose from 'mongoose';
import { CATEGORIES } from '../config/store.js';
import { fromCents } from '../utils/money.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    priceCents: { type: Number, required: true, min: 1 },
    compareAtCents: { type: Number, min: 0, default: null }, // original price, shown struck through
    category: { type: String, required: true, enum: CATEGORIES },
    brand: { type: String, trim: true, maxlength: 60, default: '' },
    image: { type: String, trim: true, default: '' }, // optional image URL
    emoji: { type: String, trim: true, maxlength: 8, default: '' }, // fallback visual when no image
    stock: { type: Number, required: true, min: 0, default: 0 },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true }, // inactive products are hidden from the store
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.price = fromCents(ret.priceCents);
        ret.compareAtPrice = ret.compareAtCents ? fromCents(ret.compareAtCents) : null;
        delete ret._id;
        delete ret.__v;
        delete ret.priceCents;
        delete ret.compareAtCents;
        return ret;
      },
    },
  }
);

productSchema.index({ active: 1, category: 1, priceCents: 1 });

export default mongoose.model('Product', productSchema);
