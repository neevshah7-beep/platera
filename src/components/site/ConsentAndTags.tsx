'use client'

import Script from 'next/script'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const KEY = 'plt_consent'
type Choice = 'granted' | 'denied'

function readChoice(): Choice | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

/**
 * Consent first, tags second. GA4 loads in Consent Mode v2 with everything denied by
 * default; the Meta Pixel loads only after the visitor allows it. The prompt is a
 * quiet line at the foot of the screen, not a wall, and choosing "only essential"
 * is one tap, same as allowing.
 */
export function ConsentAndTags({ gaId, pixelId }: { gaId?: string; pixelId?: string }) {
  const [choice, setChoice] = useState<Choice | null>(null)
  const [asked, setAsked] = useState(false)

  useEffect(() => {
    const c = readChoice()
    setChoice(c)
    setAsked(c !== null)
  }, [])

  const decide = (c: Choice) => {
    try {
      localStorage.setItem(KEY, c)
    } catch {}
    setChoice(c)
    setAsked(true)
    window.gtag?.('consent', 'update', {
      analytics_storage: c,
      ad_storage: c,
      ad_user_data: c,
      ad_personalization: c,
    })
  }

  if (!gaId && !pixelId) return null

  return (
    <>
      {gaId && (
        <>
          <Script id="ga-consent" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
            gtag('js', new Date());
            gtag('config', '${gaId}', { send_page_view: true });
          `}</Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
        </>
      )}
      {pixelId && choice === 'granted' && (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}'); fbq('track', 'PageView');
        `}</Script>
      )}
      {!asked && (
        <div role="region" aria-label="Cookie choice" className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-onyx px-[var(--gutter)] py-4">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-3 text-step--1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-ink-muted">
              We’d like to measure visits to improve the site. Nothing is sold or shared for others’ advertising.{' '}
              <Link href="/policies/privacy" className="link text-ink">Privacy</Link>
            </p>
            <div className="flex gap-3">
              <button className="btn btn-quiet min-h-10 py-2" onClick={() => decide('denied')}>Only essential</button>
              <button className="btn btn-primary min-h-10 py-2" onClick={() => decide('granted')}>Allow</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
