import mongoose from 'mongoose';
import { ORDER_STATUSES, PAYMENT_METHODS } from '../config/store.js';
import { fromCents } from '../utils/money.js';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Items are snapshotted so later product edits don't change past orders.
    items: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        emoji: String,
        image: String,
        priceCents: { type: Number, required: true },
        qty: { type: Number, required: true, min: 1 },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, default: '' },
      country: { type: String, required: true },
    },
    note: { type: String, maxlength: 300, default: '' },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'Cash on Delivery' },
    subtotalCents: { type: Number, required: true },
    shippingCents: { type: Number, required: true },
    totalCents: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    statusHistory: [{ _id: false, status: String, at: { type: Date, default: Date.now }, by: String }],
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.items = ret.items.map(({ priceCents, ...i }) => ({ ...i, price: fromCents(priceCents), lineTotal: fromCents(priceCents * i.qty) }));
        ret.subtotal = fromCents(ret.subtotalCents);
        ret.shipping = fromCents(ret.shippingCents);
        ret.total = fromCents(ret.totalCents);
        for (const k of ['_id', '__v', 'subtotalCents', 'shippingCents', 'totalCents']) delete ret[k];
        return ret;
      },
    },
  }
);

export default mongoose.model('Order', orderSchema);
