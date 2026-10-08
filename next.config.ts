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
  `script-src 'self' blob: 'unsafe-inline' 'wasm-unsafe-eval' ${dev ? "'unsafe-eval'" : ''} https://checkout.razorpay.com https://www.googletagmanager.com https://connect.facebook.net`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com https://*.razorpay.com",
  "font-src 'self'",
  // The 3D text renderer (troika) and the image decoder build their workers from blob: URLs.
  "worker-src 'self' blob:",
  "connect-src 'self' https://*.razorpay.com https://www.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net",
  'frame-src https://api.razorpay.com https://checkout.razorpay.com https://www.google.com',
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  // Upgrades every request to https: right for the live site, but it breaks a preview served
  // over plain http on the local network (a phone on the same Wi-Fi), so a build made with
  // LOCAL_PREVIEW=1 leaves it out. Never set LOCAL_PREVIEW for a deployment.
  ...(dev || process.env.LOCAL_PREVIEW === '1' ? [] : ['upgrade-insecure-requests']),
].join('; ')

const nextConfig: NextConfig = {
  // A separate output folder lets a production preview build run beside the dev server.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  poweredByHeader: false,
  // Shaders live as commented .glsl files (src/world/shaders) and import as strings.
  webpack(config, { dev: isDev }) {
    config.module.rules.push({ test: /\.(glsl|vert|frag)$/, type: 'asset/source' })
    // Blender writes a render frame every few seconds into assets/; screenshots land in
    // look/. Neither is source, and watching them made the dev server reload open pages.
    if (isDev) config.watchOptions = { ...config.watchOptions, ignored: ['**/node_modules/**', '**/.git/**', '**/assets/**', '**/look/**', '**/.next-prod/**', '**/public/scenes/**'] }
    return config
  },
  turbopack: { rules: { '*.glsl': { loaders: ['raw-loader'], as: '*.js' } } },
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
