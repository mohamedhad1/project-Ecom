/**
 * src/models/Product.ts
 *
 * Mongoose schema for clothing products.
 * Designed to be extended without breaking changes.
 */

import mongoose, { type Document, type Model, Schema } from 'mongoose'

// ── Valid enumerations ────────────────────────────────────────────────────────

export const VALID_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'ONE SIZE'] as const
export const VALID_CATEGORIES = [
  'tshirts',
  'hoodies',
  'pants',
  'jackets',
  'shorts',
  'dresses',
  'accessories',
] as const

export type ProductSize = (typeof VALID_SIZES)[number]
export type ProductCategory = (typeof VALID_CATEGORIES)[number]

// ── Document interface ────────────────────────────────────────────────────────

export interface IProduct extends Document {
  name: string
  slug: string
  description: string
  price: number
  images: string[]
  sizes: ProductSize[]
  stock: number
  category: ProductCategory
  colors: string[]
  discount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ── Slug generator ────────────────────────────────────────────────────────────

function generateSlug (name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Schema ────────────────────────────────────────────────────────────────────

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Product name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 10,
        message: 'A product cannot have more than 10 images',
      },
    },
    sizes: {
      type: [String],
      enum: {
        values: VALID_SIZES,
        message: '{VALUE} is not a valid size',
      },
      default: [],
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      lowercase: true,
      trim: true,
      enum: {
        values: VALID_CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
    },
    colors: {
      type: [String],
      default: [],
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// ── Pre-save hook: auto-generate slug ─────────────────────────────────────────

productSchema.pre('save', async function (next) {
  if (!this.isModified('name') && !this.isNew) {
    return next()
  }

  let baseSlug = generateSlug(this.name)
  let slug = baseSlug
  let suffix = 1

  // Ensure uniqueness — append numeric suffix if slug already exists
  while (await (mongoose.models['Product'] as Model<IProduct>).exists({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${suffix}`
    suffix++
  }

  this.slug = slug
  next()
})

// ── Compound indexes for common query patterns ────────────────────────────────

productSchema.index({ isActive: 1, category: 1 })
productSchema.index({ isActive: 1, price: 1 })
productSchema.index({ name: 'text', description: 'text' }) // full-text search

// ── Model (singleton pattern — safe for serverless) ───────────────────────────

export const Product: Model<IProduct> =
  (mongoose.models['Product'] as Model<IProduct>) ??
  mongoose.model<IProduct>('Product', productSchema)
