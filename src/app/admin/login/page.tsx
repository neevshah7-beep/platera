import type { Metadata } from 'next'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } }

export default function AdminLogin() {
  return (
    <main className="ground-light flex min-h-dvh items-center justify-center px-[var(--gutter)]">
      <div className="w-full max-w-sm">
        <p className="font-display text-step-3">Platera</p>
        <h1 className="mt-8 text-step-4">Sign in to manage the shop</h1>
        <LoginForm />
      </div>
    </main>
  )
}
