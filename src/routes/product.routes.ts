/**
 * src/routes/product.routes.ts
 *
 * Product API routes.
 *
 * Public  (no auth):
 *   GET  /api/products           — paginated list (active only)
 *   GET  /api/products/:id       — single product (active only)
 *
 * Admin   (JWT required):
 *   GET    /api/products/admin        — all products including inactive
 *   POST   /api/products              — create product
 *   PUT    /api/products/:id          — full update
 *   PATCH  /api/products/:id          — partial update
 *   DELETE /api/products/:id          — delete
 *   PATCH  /api/products/:id/toggle   — toggle active/inactive
 *   PATCH  /api/products/:id/stock    — set stock value
 */

import { Router } from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  patchProduct,
  deleteProduct,
  toggleProduct,
  updateStock,
  adminListProducts,
} from '../controllers/product.controller.js'
import {
  validateCreateProduct,
  validateUpdateProduct,
  validatePatchProduct,
  validateStockUpdate,
  validateObjectId,
} from '../validators/product.validator.js'

const router = Router()

// ── Public routes ─────────────────────────────────────────────────────────────

router.get('/', listProducts)
router.get('/:id', validateObjectId, getProduct)

// ── Admin routes (all require valid JWT) ─────────────────────────────────────

router.get('/admin/all', verifyToken, adminListProducts)
router.post('/', verifyToken, validateCreateProduct, createProduct)
router.put('/:id', verifyToken, validateObjectId, validateUpdateProduct, updateProduct)
router.patch('/:id/toggle', verifyToken, validateObjectId, toggleProduct)
router.patch('/:id/stock', verifyToken, validateObjectId, validateStockUpdate, updateStock)
router.patch('/:id', verifyToken, validateObjectId, validatePatchProduct, patchProduct)
router.delete('/:id', verifyToken, validateObjectId, deleteProduct)

export default router
