import { useState } from 'react'
import type { ConfirmationResult } from 'firebase/auth'
import { sendOtp, confirmOtp, waitForAuthenticatedClaim } from '../lib/firebase'

const RECAPTCHA_CONTAINER_ID = 'recaptcha-container'

type Step = 'phone' | 'code'

function toE164(digitsInput: string): string | null {
  const digits = digitsInput.replace(/\D/g, '')
  if (/^\d{10}$/.test(digits)) return `+91${digits}`
  return null
}

export default function PhoneSignIn() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitPhone() {
    const e164 = toE164(phone)
    if (!e164) {
      setError('Enter a valid 10-digit phone number')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await sendOtp(e164, RECAPTCHA_CONTAINER_ID)
      setConfirmation(result)
      setStep('code')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code, try again')
    } finally {
      setBusy(false)
    }
  }

  async function submitCode() {
    if (!confirmation || code.trim().length < 4) return
    setBusy(true)
    setError(null)
    try {
      const user = await confirmOtp(confirmation, code.trim())
      const ready = await waitForAuthenticatedClaim(user)
      if (!ready) {
        setError('Signed in, but sync is still warming up — reopen the app in a moment')
      }
      // On success the app's Firebase auth-state listener picks up the signed-in user.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect code, try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <div className="mb-10 text-center">
        <p className="text-3xl font-semibold tracking-tight">Pocket</p>
        <p className="mt-1 text-sm text-ink-muted">
          {step === 'phone' ? 'Sign in with your phone to sync your expenses' : `Enter the code sent to +91 ${phone}`}
        </p>
      </div>

      <div className="space-y-4">
        {step === 'phone' ? (
          <div>
            <div className="flex items-stretch gap-2">
              <span className="flex items-center rounded-xl border border-line px-3.5 text-base text-ink-muted dark:border-line-dark">
                +91
              </span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={(e) => e.key === 'Enter' && submitPhone()}
                placeholder="Enter phone number"
                className="w-full rounded-xl border border-line bg-transparent px-3.5 py-3 text-base outline-none focus:border-accent dark:border-line-dark dark:focus:border-accent-dark"
              />
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="code" className="mb-2 block text-sm text-ink-muted">
              Verification code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitCode()}
              placeholder="123456"
              className="w-full rounded-xl border border-line bg-transparent px-3.5 py-3 text-base tabular outline-none focus:border-accent dark:border-line-dark dark:focus:border-accent-dark"
            />
          </div>
        )}

        {error && <p className="text-sm text-cat-8">{error}</p>}

        <button
          type="button"
          onClick={step === 'phone' ? submitPhone : submitCode}
          disabled={busy}
          className="w-full rounded-2xl bg-accent py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-30 dark:bg-accent-dark dark:text-surface-darkplane"
        >
          {busy ? 'Please wait…' : step === 'phone' ? 'Continue' : 'Verify & sign in'}
        </button>

        {step === 'code' && (
          <button
            type="button"
            onClick={() => {
              setStep('phone')
              setCode('')
              setError(null)
            }}
            className="w-full text-center text-sm text-ink-muted"
          >
            Use a different number
          </button>
        )}
      </div>

      <div id={RECAPTCHA_CONTAINER_ID} />
    </div>
  )
}
