import { body, param, query, validationResult } from 'express-validator';
import { CATEGORIES, CURRENCIES, PAYMENT_METHODS, TYPES } from '../config/categories.js';

export function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = {};
  for (const e of result.array()) if (!errors[e.path]) errors[e.path] = e.msg;
  return res.status(400).json({ message: 'Validation failed', errors });
}

const ALL_CATEGORIES = [...CATEGORIES.income, ...CATEGORIES.expense];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isDay = (v) => DATE_RE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

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

export const validateRegister = [
  body('name').isString().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
  email(),
  password('password'),
  body('currency').optional().isIn(CURRENCIES).withMessage('Unsupported currency'),
  handleValidation,
];

export const validateLogin = [
  email(),
  body('password').isString().notEmpty().withMessage('Password is required'),
  handleValidation,
];

export const validateProfile = [
  body('name').optional().isString().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
  body('currency').optional().isIn(CURRENCIES).withMessage('Unsupported currency'),
  handleValidation,
];

export const validatePasswordChange = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  password('newPassword'),
  handleValidation,
];

function transactionRules({ partial }) {
  const req = (chain) => (partial ? chain.optional() : chain);
  return [
    req(body('type')).isIn(TYPES).withMessage('Type must be income or expense'),
    req(body('amount'))
      .custom((v) => typeof v !== 'boolean' && /^\d+(\.\d{1,2})?$/.test(String(v)) && Number(v) > 0 && Number(v) <= 1e9)
      .withMessage('Amount must be a positive number with up to 2 decimals'),
    req(body('category')).isIn(ALL_CATEGORIES).withMessage('Unknown category'),
    req(body('date')).custom(isDay).withMessage('Date must be YYYY-MM-DD'),
    body('description').optional().isString().trim().isLength({ max: 120 }).withMessage('Description must be under 120 characters'),
    body('paymentMethod')
      .optional({ values: 'null' })
      .custom((v) => v === '' || PAYMENT_METHODS.includes(v))
      .withMessage('Unknown payment method'),
    handleValidation,
  ];
}

export const validateCreateTx = transactionRules({ partial: false });
export const validateUpdateTx = transactionRules({ partial: true });
export const validateId = [param('id').isMongoId().withMessage('Invalid id'), handleValidation];

export const SORT_FIELDS = ['date', 'amount', 'category', 'createdAt'];

const rangeRules = [
  query('from').optional({ values: 'falsy' }).custom(isDay).withMessage('from must be YYYY-MM-DD'),
  query('to').optional({ values: 'falsy' }).custom(isDay).withMessage('to must be YYYY-MM-DD'),
  query('to')
    .optional({ values: 'falsy' })
    .custom((to, { req }) => !req.query.from || req.query.from <= to)
    .withMessage('to must be on or after from'),
];

export const validateListTx = [
  ...rangeRules,
  query('type').optional({ values: 'falsy' }).isIn(TYPES).withMessage('Unknown type'),
  query('category').optional({ values: 'falsy' }).isIn(ALL_CATEGORIES).withMessage('Unknown category'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('sort')
    .optional()
    .custom((v) => SORT_FIELDS.includes(String(v).replace(/^-/, '')))
    .withMessage(`sort must be one of: ${SORT_FIELDS.join(', ')}`),
  handleValidation,
];

export const validateRange = [...rangeRules, handleValidation];
