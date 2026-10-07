/**
 * src/services/product.service.ts
 *
 * All product business logic — database operations, filtering, pagination.
 * Controllers call these functions; they never touch req/res.
 */

import { connectDatabase } from '../config/database.js'
import { Product, type IProduct } from '../models/Product.js'
import { ApiError } from '../utils/ApiError.js'
import type { PaginationMeta } from '../utils/ApiResponse.js'

// ── Query options interface ───────────────────────────────────────────────────

export interface GetProductsOptions {
  page?: number
  limit?: number
  category?: string
  search?: string
  size?: string
  isActive?: boolean
  includeInactive?: boolean // admin-only flag
}

export interface ProductsResult {
  products: IProduct[]
  pagination: PaginationMeta
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Get paginated product list with optional filtering and search.
 */
export async function getProducts (options: GetProductsOptions): Promise<ProductsResult> {
  await connectDatabase()

  const page = Math.max(1, options.page ?? 1)
  const limit = Math.min(50, Math.max(1, options.limit ?? 12))
  const skip = (page - 1) * limit

  // Build the filter query
  const filter: Record<string, unknown> = {}

  // Public API always filters to active products unless admin explicitly requests otherwise
  if (!options.includeInactive) {
    filter.isActive = true
  }

  if (options.category) {
    filter.category = options.category.toLowerCase()
  }

  if (options.size) {
    filter.sizes = options.size.toUpperCase()
  }

  if (options.search) {
    filter.$text = { $search: options.search }
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(options.search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    products: products as unknown as IProduct[],
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  }
}

/**
 * Get a single product by its MongoDB _id.
 * Public: only returns active products.
 * Admin: pass includeInactive = true to fetch any product.
 */
export async function getProductById (
  id: string,
  includeInactive = false,
): Promise<IProduct> {
  await connectDatabase()

  const filter: Record<string, unknown> = { _id: id }
  if (!includeInactive) {
    filter.isActive = true
  }

  const product = await Product.findOne(filter).lean()

  if (!product) {
    throw ApiError.notFound('Product not found')
  }

  return product as unknown as IProduct
}

/**
 * Get a single product by its slug (public-facing, SEO-friendly).
 */
export async function getProductBySlug (slug: string): Promise<IProduct> {
  await connectDatabase()

  const product = await Product.findOne({ slug, isActive: true }).lean()

  if (!product) {
    throw ApiError.notFound('Product not found')
  }

  return product as unknown as IProduct
}

/**
 * Create a new product. Admin only.
 */
export async function createProduct (
  data: Partial<IProduct>,
): Promise<IProduct> {
  await connectDatabase()

  const product = new Product(data)
  await product.save()

  return product
}

/**
 * Full update (PUT) — replaces the product fields. Admin only.
 */
export async function updateProduct (
  id: string,
  data: Partial<IProduct>,
): Promise<IProduct> {
  await connectDatabase()

  const product = await Product.findById(id)

  if (!product) {
    throw ApiError.notFound('Product not found')
  }

  Object.assign(product, data)
  await product.save()

  return product
}

/**
 * Partial update (PATCH) — merges provided fields. Admin only.
 */
export async function patchProduct (
  id: string,
  data: Partial<IProduct>,
): Promise<IProduct> {
  await connectDatabase()

  const product = await Product.findById(id)

  if (!product) {
    throw ApiError.notFound('Product not found')
  }

  // Only assign fields that were explicitly provided
  const allowedFields: (keyof IProduct)[] = [
    'name', 'description', 'price', 'images',
    'sizes', 'stock', 'category', 'colors', 'discount', 'isActive',
  ]

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      (product as unknown as Record<string, unknown>)[field] = data[field]
    }
  }

  await product.save()
  return product
}

/**
 * Delete a product permanently. Admin only.
 */
export async function deleteProduct (id: string): Promise<void> {
  await connectDatabase()

  const product = await Product.findByIdAndDelete(id)

  if (!product) {
    throw ApiError.notFound('Product not found')
  }
}

/**
 * Toggle product active/inactive state. Admin only.
 */
export async function toggleProductActive (id: string): Promise<IProduct> {
  await connectDatabase()

  const product = await Product.findById(id)

  if (!product) {
    throw ApiError.notFound('Product not found')
  }

  product.isActive = !product.isActive
  await product.save()

  return product
}

/**
 * Set absolute stock value. Admin only.
 */
export async function setProductStock (id: string, stock: number): Promise<IProduct> {
  await connectDatabase()

  if (stock < 0) {
    throw ApiError.badRequest('Stock cannot be negative')
  }

  const product = await Product.findById(id)

  if (!product) {
    throw ApiError.notFound('Product not found')
  }

  product.stock = stock
  await product.save()

  return product
}
