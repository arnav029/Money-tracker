import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'signin' | 'signup'

export default function EmailSignIn() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !busy

  async function submit() {
    if (!supabase || !canSubmit) return
    setBusy(true)
    setError(null)

    if (mode === 'signin') {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })
      setBusy(false)
      if (err) setError(err.message)
      // On success, the app's onAuthStateChange listener picks up the new session.
      return
    }

    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password
    })
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    if (!data.session) {
      setConfirmationSent(true)
    }
  }

  if (confirmationSent) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-3xl font-semibold tracking-tight">Check your email</p>
        <p className="mt-2 text-sm text-ink-muted">
          We sent a confirmation link to {email.trim()}. Confirm it, then sign in below.
        </p>
        <button
          type="button"
          onClick={() => {
            setConfirmationSent(false)
            setMode('signin')
          }}
          className="mt-6 w-full rounded-2xl bg-accent py-3.5 text-base font-semibold text-white dark:bg-accent-dark dark:text-surface-darkplane"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <div className="mb-10 text-center">
        <p className="text-3xl font-semibold tracking-tight">Pocket</p>
        <p className="mt-1 text-sm text-ink-muted">
          {mode === 'signin' ? 'Sign in to sync your expenses' : 'Create an account to sync your expenses'}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm text-ink-muted">
            Email
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-line bg-transparent px-3.5 py-3 text-base outline-none focus:border-accent dark:border-line-dark dark:focus:border-accent-dark"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm text-ink-muted">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="At least 6 characters"
            className="w-full rounded-xl border border-line bg-transparent px-3.5 py-3 text-base outline-none focus:border-accent dark:border-line-dark dark:focus:border-accent-dark"
          />
        </div>

        {error && <p className="text-sm text-cat-8">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="w-full rounded-2xl bg-accent py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-30 dark:bg-accent-dark dark:text-surface-darkplane"
        >
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
            setError(null)
          }}
          className="w-full text-center text-sm text-ink-muted"
        >
          {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
