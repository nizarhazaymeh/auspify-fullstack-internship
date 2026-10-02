import { body, param, query, validationResult } from 'express-validator';
import { CATEGORIES, MAX_QTY_PER_ITEM, ORDER_STATUSES } from '../config/store.js';

export function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = {};
  for (const e of result.array()) if (!errors[e.path]) errors[e.path] = e.msg;
  return res.status(400).json({ message: 'Validation failed', errors });
}

const money = (v) => typeof v !== 'boolean' && /^\d+(\.\d{1,2})?$/.test(String(v)) && Number(v) <= 1e7;
const password = (field) =>
  body(field)
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain a letter')
    .matches(/\d/)
    .withMessage('Password must contain a number');
const email = () => body('email').isString().trim().isEmail().withMessage('Enter a valid email').normalizeEmail({ gmail_remove_dots: false });

export const validateId = (name = 'id') => [param(name).isMongoId().withMessage('Invalid id'), handleValidation];

// ── Auth ──
export const validateRegister = [
  body('name').isString().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
  email(),
  password('password'),
  handleValidation,
];
export const validateLogin = [email(), body('password').isString().notEmpty().withMessage('Password is required'), handleValidation];
export const validatePasswordChange = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  password('newPassword'),
  handleValidation,
];

const addressRules = (prefix, { optional = false } = {}) => {
  const f = (name) => (optional ? body(`${prefix}.${name}`).optional() : body(`${prefix}.${name}`));
  return [
    f('fullName').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Full name is required'),
    f('phone').isString().trim().matches(/^[+\d][\d\s()-]{6,20}$/).withMessage('Enter a valid phone number'),
    f('street').isString().trim().isLength({ min: 3, max: 120 }).withMessage('Street address is required'),
    f('city').isString().trim().isLength({ min: 2, max: 60 }).withMessage('City is required'),
    body(`${prefix}.postalCode`).optional().isString().trim().isLength({ max: 15 }).withMessage('Postal code is too long'),
    f('country').isString().trim().isLength({ min: 2, max: 60 }).withMessage('Country is required'),
  ];
};

export const validateProfile = [
  body('name').optional().isString().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
  body('address').optional().isObject().withMessage('Address must be an object'),
  ...addressRules('address', { optional: true }),
  handleValidation,
];

// ── Products ──
const productRules = ({ partial }) => {
  const req = (chain) => (partial ? chain.optional() : chain);
  return [
    req(body('name')).isString().trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2–120 characters'),
    req(body('price')).custom((v) => money(v) && Number(v) > 0).withMessage('Price must be a positive amount'),
    req(body('category')).isIn(CATEGORIES).withMessage('Unknown category'),
    req(body('stock')).isInt({ min: 0, max: 100000 }).withMessage('Stock must be a whole number ≥ 0').toInt(),
    body('compareAtPrice')
      .optional({ values: 'null' })
      .custom((v) => v === '' || money(v))
      .withMessage('Compare-at price must be an amount'),
    body('description').optional().isString().trim().isLength({ max: 2000 }).withMessage('Description is too long'),
    body('brand').optional().isString().trim().isLength({ max: 60 }).withMessage('Brand is too long'),
    body('image')
      .optional({ values: 'falsy' })
      .isURL({ protocols: ['https', 'http'], require_protocol: true })
      .withMessage('Image must be a full http(s) URL'),
    body('emoji').optional().isString().isLength({ max: 8 }).withMessage('Emoji is too long'),
    body('featured').optional().isBoolean().withMessage('featured must be true/false').toBoolean(),
    body('active').optional().isBoolean().withMessage('active must be true/false').toBoolean(),
    handleValidation,
  ];
};
export const validateCreateProduct = productRules({ partial: false });
export const validateUpdateProduct = productRules({ partial: true });

export const PRODUCT_SORTS = ['newest', 'price-asc', 'price-desc', 'name', 'stock'];
export const validateProductQuery = [
  query('category').optional({ values: 'falsy' }).isIn(CATEGORIES).withMessage('Unknown category'),
  query('minPrice').optional({ values: 'falsy' }).custom(money).withMessage('minPrice must be an amount'),
  query('maxPrice').optional({ values: 'falsy' }).custom(money).withMessage('maxPrice must be an amount'),
  query('sort').optional({ values: 'falsy' }).isIn(PRODUCT_SORTS).withMessage(`sort must be one of: ${PRODUCT_SORTS.join(', ')}`),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 60 }).withMessage('limit must be between 1 and 60'),
  handleValidation,
];

// ── Cart ──
const qty = (chain) => chain.isInt({ min: 1, max: MAX_QTY_PER_ITEM }).withMessage(`Quantity must be 1–${MAX_QTY_PER_ITEM}`).toInt();
export const validateAddToCart = [body('productId').isMongoId().withMessage('Invalid product'), qty(body('qty').optional()), handleValidation];
export const validateSetQty = [...validateId('productId').slice(0, 1), qty(body('qty')), handleValidation];
export const validateMergeCart = [
  body('items').isArray({ max: 50 }).withMessage('items must be an array'),
  body('items.*.productId').isMongoId().withMessage('Invalid product'),
  qty(body('items.*.qty')),
  handleValidation,
];

// ── Orders ──
export const validateCheckout = [
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  ...addressRules('shippingAddress'),
  body('note').optional().isString().trim().isLength({ max: 300 }).withMessage('Note must be under 300 characters'),
  body('saveAddress').optional().isBoolean().toBoolean(),
  handleValidation,
];
export const validateStatus = [body('status').isIn(ORDER_STATUSES).withMessage('Unknown status'), handleValidation];
export const validateOrderQuery = [
  query('status').optional({ values: 'falsy' }).isIn(ORDER_STATUSES).withMessage('Unknown status'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  handleValidation,
];
