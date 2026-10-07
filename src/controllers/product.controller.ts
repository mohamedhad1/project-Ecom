/**
 * src/controllers/product.controller.ts
 *
 * HTTP layer for product endpoints.
 * Thin: reads request data → calls service → sends response.
 * All business logic lives in product.service.ts.
 */

import type { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import * as productService from '../services/product.service.js'
import { successResponse, paginatedResponse } from '../utils/ApiResponse.js'

// ── Helper: check validation result and abort if errors ──────────────────────

function checkValidation (req: Request, res: Response): boolean {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.type === 'field' ? e.path : e.type, message: e.msg })),
    })
    return false
  }
  return true
}

function parseIntParam (val: unknown): number {
  return parseInt(String(val), 10)
}

// ── Public controllers ────────────────────────────────────────────────────────

/**
 * GET /api/products
 * Query params: page, limit, category, search, size
 */
export async function listProducts (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, category, search, size } = req.query

    const result = await productService.getProducts({
      page: page !== undefined ? parseIntParam(page) : 1,
      limit: limit !== undefined ? parseIntParam(limit) : 12,
      category: typeof category === 'string' ? category : undefined,
      search: typeof search === 'string' ? search : undefined,
      size: typeof size === 'string' ? size : undefined,
      includeInactive: false,
    })

    res.json(paginatedResponse(result.products, result.pagination))
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/products/:id
 */
export async function getProduct (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!checkValidation(req, res)) return

    const product = await productService.getProductById(req.params['id'] as string)
    res.json(successResponse(product))
  } catch (err) {
    next(err)
  }
}

// ── Admin controllers ─────────────────────────────────────────────────────────

/**
 * POST /api/products  [Admin]
 */
export async function createProduct (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!checkValidation(req, res)) return

    const product = await productService.createProduct(req.body as Record<string, unknown>)
    res.status(201).json(successResponse(product, 'Product created successfully'))
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/products/:id  [Admin]
 */
export async function updateProduct (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!checkValidation(req, res)) return

    const product = await productService.updateProduct(req.params['id'] as string, req.body as Record<string, unknown>)
    res.json(successResponse(product, 'Product updated successfully'))
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/products/:id  [Admin]
 */
export async function patchProduct (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!checkValidation(req, res)) return

    const product = await productService.patchProduct(req.params['id'] as string, req.body as Record<string, unknown>)
    res.json(successResponse(product, 'Product updated successfully'))
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/products/:id  [Admin]
 */
export async function deleteProduct (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!checkValidation(req, res)) return

    await productService.deleteProduct(req.params['id'] as string)
    res.json(successResponse(null, 'Product deleted successfully'))
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/products/:id/toggle  [Admin]
 * Toggle isActive flag.
 */
export async function toggleProduct (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!checkValidation(req, res)) return

    const product = await productService.toggleProductActive(req.params['id'] as string)
    const status = product.isActive ? 'activated' : 'deactivated'
    res.json(successResponse(product, `Product ${status} successfully`))
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/products/:id/stock  [Admin]
 * Set absolute stock value.
 */
export async function updateStock (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!checkValidation(req, res)) return

    const stock = parseIntParam((req.body as Record<string, unknown>).stock)
    const product = await productService.setProductStock(req.params['id'] as string, stock)
    res.json(successResponse(product, 'Stock updated successfully'))
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/products/admin/all  [Admin]
 * Admin version: includes inactive products + all filters.
 */
export async function adminListProducts (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, category, search, size, includeInactive } = req.query

    const result = await productService.getProducts({
      page: page !== undefined ? parseIntParam(page) : 1,
      limit: limit !== undefined ? parseIntParam(limit) : 20,
      category: typeof category === 'string' ? category : undefined,
      search: typeof search === 'string' ? search : undefined,
      size: typeof size === 'string' ? size : undefined,
      includeInactive: includeInactive === 'true',
    })

    res.json(paginatedResponse(result.products, result.pagination))
  } catch (err) {
    next(err)
  }
}

