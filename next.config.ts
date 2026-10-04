import type { NextConfig } from 'next'

const dev = process.env.NODE_ENV !== 'production'

/**
 * Content Security Policy. Only the third parties the site actually uses:
 * Razorpay (payment window), Google Analytics, the Meta Pixel, the Google Maps
 * embed on /visit, and Vercel Blob for uploaded photographs.
 * Scripts allow 'unsafe-inline' because nonce-based CSP would force every page to
 * render dynamically and lose ISR; the inline scripts are our own (JSON-LD, consent).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${dev ? "'unsafe-eval'" : ''} https://checkout.razorpay.com https://www.googletagmanager.com https://connect.facebook.net`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com https://*.razorpay.com",
  "font-src 'self'",
  "connect-src 'self' https://*.razorpay.com https://www.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net",
  'frame-src https://api.razorpay.com https://checkout.razorpay.com https://www.google.com',
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  ...(dev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Admin photo uploads go through a server action; photos can be 10–20 MB each.
    serverActions: { bodySizeLimit: '60mb' },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com")' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        source: '/media/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

export default nextConfig
