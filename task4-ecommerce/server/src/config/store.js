export const CATEGORIES = ['Electronics', 'Fashion', 'Home & Kitchen', 'Sports & Outdoors', 'Books', 'Beauty'];

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

// Allowed admin transitions. Customers may only cancel while an order is pending.
export const STATUS_FLOW = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const SHIPPING = { flatCents: 500, freeOverCents: 5000 };
export const MAX_QTY_PER_ITEM = 10;
export const PAYMENT_METHODS = ['Cash on Delivery'];
