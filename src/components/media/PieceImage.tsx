import type { ProductImage } from '@prisma/client'

const WIDTHS = [480, 960, 1600] as const

/** Local files live under /media; uploads in production are full Vercel Blob URLs. */
export function mediaBase(src: string) {
  return src.startsWith('http') ? src : `/media/${src}`
}

function srcSet(src: string, ext: 'avif' | 'webp') {
  return WIDTHS.map((w) => `${mediaBase(src)}-${w}.${ext} ${w}w`).join(', ')
}

/**
 * A product photograph from our own pipeline (scripts/process-images.ts):
 * AVIF then WebP, three widths, intrinsic size reserved, 20px blur underneath.
 * We don't route these through next/image because they're already optimised,
 * and doing it twice costs quality and build time.
 */
export function PieceImage({
  image,
  sizes,
  priority = false,
  className = '',
}: {
  image: Pick<ProductImage, 'src' | 'width' | 'height' | 'alt' | 'lqip'>
  sizes: string
  priority?: boolean
  className?: string
}) {
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={srcSet(image.src, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(image.src, 'webp')} sizes={sizes} />
      <img
        src={`${mediaBase(image.src)}-960.webp`}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        className="block h-auto w-full bg-onyx object-cover"
        style={{ backgroundImage: `url(${image.lqip})`, backgroundSize: 'cover' }}
      />
    </picture>
  )
}
