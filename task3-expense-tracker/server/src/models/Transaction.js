import mongoose from 'mongoose';
import { CATEGORIES, PAYMENT_METHODS, TYPES } from '../config/categories.js';
import { fromCents } from '../utils/money.js';

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: TYPES, required: true },
    amountCents: { type: Number, required: true, min: 1 },
    category: {
      type: String,
      required: true,
      validate: {
        validator(v) {
          return CATEGORIES[this.type]?.includes(v) ?? false;
        },
        message: 'Category does not match the transaction type',
      },
    },
    date: { type: Date, required: true },
    description: { type: String, trim: true, maxlength: 120, default: '' },
    paymentMethod: { type: String, enum: [...PAYMENT_METHODS, null], default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.amount = fromCents(ret.amountCents);
        delete ret._id;
        delete ret.__v;
        delete ret.amountCents;
        delete ret.user;
        return ret;
      },
    },
  }
);

transactionSchema.index({ user: 1, date: -1 });

export default mongoose.model('Transaction', transactionSchema);
