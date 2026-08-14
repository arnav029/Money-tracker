import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Step = 'phone' | 'otp'

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, '')
}

export default function PhoneSignIn() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('+91 ')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedPhone = normalizePhone(phone)
  const canSendCode = normalizedPhone.length >= 10 && normalizedPhone.startsWith('+') && !busy
  const canVerify = code.trim().length >= 4 && !busy

  async function sendCode() {
    if (!supabase || !canSendCode) return
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithOtp({ phone: normalizedPhone })
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    setStep('otp')
  }

  async function verifyCode() {
    if (!supabase || !canVerify) return
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: code.trim(),
      type: 'sms'
    })
    setBusy(false)
    if (err) {
      setError(err.message)
    }
    // On success, the app's onAuthStateChange listener picks up the new session.
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <div className="mb-10 text-center">
        <p className="text-3xl font-semibold tracking-tight">Pocket</p>
        <p className="mt-1 text-sm text-ink-muted">Sign in to sync your expenses</p>
      </div>

      {step === 'phone' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm text-ink-muted">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendCode()}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-line bg-transparent px-3.5 py-3 text-base outline-none focus:border-accent dark:border-line-dark dark:focus:border-accent-dark"
            />
          </div>
          {error && <p className="text-sm text-cat-8">{error}</p>}
          <button
            type="button"
            onClick={sendCode}
            disabled={!canSendCode}
            className="w-full rounded-2xl bg-accent py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-30 dark:bg-accent-dark dark:text-surface-darkplane"
          >
            {busy ? 'Sending…' : 'Send code'}
          </button>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="code" className="mb-2 block text-sm text-ink-muted">
              Code sent to {normalizedPhone}
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
              placeholder="123456"
              className="tabular w-full rounded-xl border border-line bg-transparent px-3.5 py-3 text-center text-2xl tracking-[0.3em] outline-none focus:border-accent dark:border-line-dark dark:focus:border-accent-dark"
            />
          </div>
          {error && <p className="text-sm text-cat-8">{error}</p>}
          <button
            type="button"
            onClick={verifyCode}
            disabled={!canVerify}
            className="w-full rounded-2xl bg-accent py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-30 dark:bg-accent-dark dark:text-surface-darkplane"
          >
            {busy ? 'Verifying…' : 'Verify'}
          </button>
          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep('phone')
                setCode('')
                setError(null)
              }}
              className="text-ink-muted"
            >
              Change number
            </button>
            <button type="button" onClick={sendCode} disabled={busy} className="text-accent dark:text-accent-dark">
              Resend code
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
