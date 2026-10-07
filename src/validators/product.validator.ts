/**
 * src/validators/product.validator.ts
 *
 * express-validator chains for product endpoints.
 * Used in routes before the controller — invalid requests are rejected early.
 */

import { body, param } from 'express-validator'
import { VALID_SIZES, VALID_CATEGORIES } from '../models/Product.js'

// ── Shared field validators ───────────────────────────────────────────────────

const nameValidator = body('name')
  .trim()
  .notEmpty().withMessage('Product name is required')
  .isLength({ max: 120 }).withMessage('Product name cannot exceed 120 characters')

const descriptionValidator = body('description')
  .trim()
  .notEmpty().withMessage('Product description is required')
  .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters')

const priceValidator = body('price')
  .notEmpty().withMessage('Price is required')
  .isFloat({ min: 0 }).withMessage('Price must be a non-negative number')

const stockValidator = body('stock')
  .optional()
  .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')

const categoryValidator = body('category')
  .trim()
  .notEmpty().withMessage('Category is required')
  .toLowerCase()
  .isIn(VALID_CATEGORIES).withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`)

const sizesValidator = body('sizes')
  .optional()
  .isArray().withMessage('Sizes must be an array')
  .custom((arr: unknown[]) => {
    const invalid = arr.filter((s) => !VALID_SIZES.includes(s as never))
    if (invalid.length > 0) {
      throw new Error(`Invalid sizes: ${invalid.join(', ')}. Valid: ${VALID_SIZES.join(', ')}`)
    }
    return true
  })

const imagesValidator = body('images')
  .optional()
  .isArray({ max: 10 }).withMessage('Images must be an array with at most 10 items')
  .custom((arr: unknown[]) => {
    for (const url of arr) {
      if (typeof url !== 'string' || url.trim() === '') {
        throw new Error('Each image must be a non-empty URL string')
      }
    }
    return true
  })

const colorsValidator = body('colors')
  .optional()
  .isArray().withMessage('Colors must be an array')

const discountValidator = body('discount')
  .optional()
  .isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100')

const isActiveValidator = body('isActive')
  .optional()
  .isBoolean().withMessage('isActive must be a boolean')

// ── Exported validation chains ────────────────────────────────────────────────

/** Full validation for POST /api/products */
export const validateCreateProduct = [
  nameValidator,
  descriptionValidator,
  priceValidator,
  stockValidator,
  categoryValidator,
  sizesValidator,
  imagesValidator,
  colorsValidator,
  discountValidator,
  isActiveValidator,
]

/** Full validation for PUT /api/products/:id */
export const validateUpdateProduct = [
  nameValidator,
  descriptionValidator,
  priceValidator,
  stockValidator,
  categoryValidator,
  sizesValidator,
  imagesValidator,
  colorsValidator,
  discountValidator,
  isActiveValidator,
]

/** Partial validation for PATCH /api/products/:id */
export const validatePatchProduct = [
  body('name').optional().trim().isLength({ max: 120 }).withMessage('Name cannot exceed 120 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description too long'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative'),
  stockValidator,
  body('category').optional().toLowerCase().isIn(VALID_CATEGORIES).withMessage('Invalid category'),
  sizesValidator,
  imagesValidator,
  colorsValidator,
  discountValidator,
  isActiveValidator,
]

/** Stock update validation for PATCH /api/products/:id/stock */
export const validateStockUpdate = [
  body('stock')
    .notEmpty().withMessage('Stock value is required')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
]

/** MongoDB ObjectId param validation */
export const validateObjectId = [
  param('id')
    .isMongoId().withMessage('Invalid product ID format'),
]
