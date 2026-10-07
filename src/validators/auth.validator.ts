/**
 * src/validators/auth.validator.ts
 *
 * express-validator chains for auth endpoints.
 */

import { body } from 'express-validator'

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 1 }).withMessage('Password cannot be empty'),
]
