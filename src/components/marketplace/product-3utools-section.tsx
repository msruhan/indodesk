'use client'

import { Product3uToolsGallery } from '@/components/marketplace/product-3utools-gallery'
import type { ProductImageEntry } from '@/lib/product-images'

type Props = {
  images: ProductImageEntry[]
  className?: string
}

/** @deprecated Sidebar card — gunakan Product3uToolsGallery embedded di ProductDetailSpecsCard */
export function Product3uToolsSection({ images, className }: Props) {
  return <Product3uToolsGallery images={images} variant="card" className={className} />
}
