import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { siteUrl } from '@/lib/store'
import './globals.css'
import './viewing.css'
import './sitting.css'
import './welcome.css'
import './house.css'

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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Platera Jewellers · 925 Silver Jewellery, Borivali West', template: '%s · Platera Jewellers' },
  description:
    'Hallmarked 925 silver jewellery chosen piece by piece and priced in the open. Presented in collaboration with Bhairav Jewellers, Gorai 1, Borivali West, Mumbai.',
  alternates: { canonical: '/', languages: { 'en-IN': '/' } },
  openGraph: { type: 'website', locale: 'en_IN', siteName: 'Platera Jewellers' },
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
