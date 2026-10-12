import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { siteUrl } from '@/lib/store'
import './globals.css'
import './viewing.css'
import './sitting.css'
import './welcome.css'
import './house.css'
import './journey.css'
import './piece.css'
import './premium.css'

const gambetta = localFont({
  src: [
    { path: './fonts/Gambetta-Variable.woff2', style: 'normal', weight: '300 700' },
    { path: './fonts/Gambetta-VariableItalic.woff2', style: 'italic', weight: '300 700' },
  ],
  variable: '--font-gambetta',
  display: 'swap',
  fallback: ['Iowan Old Style', 'Georgia', 'serif'],
})

const satoshi = localFont({
  src: './fonts/Satoshi-Variable.woff2',
  weight: '300 900',
  variable: '--font-satoshi',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})

/** Only the live site on its real domain is offered to search engines; previews never are. */
const indexable = process.env.VERCEL_ENV === 'production' || process.env.SITE_INDEXABLE === '1'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Platera Jewellers · 925 Silver Jewellery, Borivali West, Mumbai', template: '%s · Platera Jewellers' },
  description:
    'Hallmarked 925 silver jewellery, chosen piece by piece: necklace sets, payals, earrings and mangalsutras. Buy on WhatsApp. Gorai 1, Borivali West, Mumbai.',
  applicationName: 'Platera Jewellers',
  category: 'Jewellery',
  openGraph: { type: 'website', locale: 'en_IN', siteName: 'Platera Jewellers' },
  twitter: { card: 'summary_large_image' },
  robots: indexable
    ? { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } }
    : { index: false, follow: false },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION, other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#e8d3a6',
  colorScheme: 'light',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${gambetta.variable} ${satoshi.variable}`} suppressHydrationWarning>
      <head>
        {/* Returning visitors skip the entry veil: marked before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: "try{if(sessionStorage.getItem('platera:entered')==='1')document.documentElement.dataset.returning='1'}catch(e){}" }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
