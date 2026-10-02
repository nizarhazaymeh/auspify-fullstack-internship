import { body, param, query, validationResult } from 'express-validator';
import { COURSES, GENDERS } from '../models/Student.js';

export const SORT_FIELDS = ['firstName', 'lastName', 'studentId', 'course', 'year', 'gpa', 'createdAt'];

// Responds 400 with field-level messages when any preceding validator failed.
export function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = {};
  for (const e of result.array()) {
    if (!errors[e.path]) errors[e.path] = e.msg;
  }
  return res.status(400).json({ message: 'Validation failed', errors });
}

const optionalEmpty = { values: 'falsy' };

function studentRules({ partial }) {
  const req = (chain) => (partial ? chain.optional() : chain);
  return [
    req(body('studentId'))
      .isString()
      .trim()
      .matches(/^[A-Za-z0-9-]{3,20}$/)
      .withMessage('Student ID must be 3–20 letters, numbers or dashes'),
    req(body('firstName')).isString().trim().isLength({ min: 1, max: 50 }).withMessage('First name is required (max 50 chars)'),
    req(body('lastName')).isString().trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required (max 50 chars)'),
    req(body('email')).isString().trim().isEmail().withMessage('A valid email is required').normalizeEmail({ gmail_remove_dots: false }),
    req(body('course')).isIn(COURSES).withMessage(`Course must be one of: ${COURSES.join(', ')}`),
    req(body('year')).isInt({ min: 1, max: 5 }).withMessage('Year must be between 1 and 5').toInt(),
    body('phone')
      .optional(optionalEmpty)
      .isString()
      .trim()
      .matches(/^[+\d][\d\s()-]{6,19}$/)
      .withMessage('Phone number is invalid'),
    body('dateOfBirth').optional(optionalEmpty).isISO8601().withMessage('Date of birth must be a valid date').toDate(),
    body('gender').optional(optionalEmpty).isIn(GENDERS).withMessage(`Gender must be one of: ${GENDERS.join(', ')}`),
    body('gpa')
      .optional({ values: 'null' })
      .custom((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 4))
      .withMessage('GPA must be between 0 and 4')
      .customSanitizer((v) => (v === '' ? null : Number(v))),
    body('address').optional().isString().trim().isLength({ max: 200 }).withMessage('Address must be under 200 characters'),
  ];
}

export const validateId = [param('id').isMongoId().withMessage('Invalid student id'), handleValidation];
export const validateCreate = [...studentRules({ partial: false }), handleValidation];
export const validateUpdate = [...studentRules({ partial: true }), handleValidation];

export const validateList = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('course').optional({ values: 'falsy' }).isIn(COURSES).withMessage('Unknown course'),
  query('year').optional({ values: 'falsy' }).isInt({ min: 1, max: 5 }).withMessage('year must be between 1 and 5'),
  query('sort')
    .optional()
    .custom((v) => SORT_FIELDS.includes(String(v).replace(/^-/, '')))
    .withMessage(`sort must be one of: ${SORT_FIELDS.join(', ')} (prefix with - for descending)`),
  handleValidation,
];
