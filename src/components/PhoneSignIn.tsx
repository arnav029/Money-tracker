import { useRef, useState } from 'react'
import type { ConfirmationResult } from 'firebase/auth'
import { sendOtp, confirmOtp, waitForAuthenticatedClaim } from '../lib/firebase'

const RECAPTCHA_CONTAINER_ID = 'recaptcha-container'
const CODE_LENGTH = 6

type Step = 'phone' | 'code'

function toE164(digitsInput: string): string | null {
  const digits = digitsInput.replace(/\D/g, '')
  if (/^\d{10}$/.test(digits)) return `+91${digits}`
  return null
}

export default function PhoneSignIn() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const codeInputs = useRef<Array<HTMLInputElement | null>>([])

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
      requestAnimationFrame(() => codeInputs.current[0]?.focus())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code, try again')
    } finally {
      setBusy(false)
    }
  }

  async function submitCode(code: string) {
    if (!confirmation || code.length < CODE_LENGTH || busy) return
    setBusy(true)
    setError(null)
    try {
      const user = await confirmOtp(confirmation, code)
      const ready = await waitForAuthenticatedClaim(user)
      if (!ready) {
        setError('Signed in, but sync is still warming up — reopen the app in a moment')
      }
      // On success the app's Firebase auth-state listener picks up the signed-in user.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect code, try again')
      setDigits(Array(CODE_LENGTH).fill(''))
      codeInputs.current[0]?.focus()
    } finally {
      setBusy(false)
    }
  }

  /** Fills every box from a full (or partial) code string — used by paste and by autofill,
   *  which sets an input's value directly rather than firing a paste event. */
  function applyFullCode(raw: string) {
    const code = raw.replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!code) return
    const next = Array(CODE_LENGTH).fill('')
    for (let i = 0; i < code.length; i++) next[i] = code[i]
    setDigits(next)
    codeInputs.current[Math.min(code.length, CODE_LENGTH - 1)]?.focus()
    if (code.length === CODE_LENGTH) submitCode(code)
  }

  function handleDigitChange(index: number, rawValue: string) {
    const incoming = rawValue.replace(/\D/g, '')
    if (incoming.length > 1) {
      applyFullCode(incoming)
      return
    }
    const next = [...digits]
    next[index] = incoming
    setDigits(next)
    if (incoming && index < CODE_LENGTH - 1) codeInputs.current[index + 1]?.focus()
    const code = next.join('')
    if (code.length === CODE_LENGTH) submitCode(code)
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      codeInputs.current[index - 1]?.focus()
      handleDigitChange(index - 1, '')
    }
  }

  function handleCodePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text')
    if (!/\d/.test(pasted)) return
    e.preventDefault()
    applyFullCode(pasted)
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-12rem] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-accent/25 blur-[110px] dark:bg-accent-dark/20"
      />

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent shadow-lg shadow-accent/30 dark:bg-accent-dark dark:shadow-accent-dark/20">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 8a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
                stroke="white"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path d="M4 8V6.5A2.5 2.5 0 0 1 6.5 4H15" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
              <path d="M16 12.5h3" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-2xl font-semibold tracking-tight">Pocket</p>
          <p className="mt-1.5 text-sm text-ink-muted">
            {step === 'phone' ? 'Sign in to sync your expenses' : `Code sent to +91 ${phone}`}
          </p>
        </div>

        <div className="space-y-5">
          {step === 'phone' ? (
            <div className="flex items-stretch overflow-hidden rounded-2xl border border-line bg-transparent transition-colors focus-within:border-accent dark:border-line-dark dark:focus-within:border-accent-dark">
              <span className="flex select-none items-center border-r border-line pl-4 pr-3 text-base text-ink-muted dark:border-line-dark">
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
                className="w-full bg-transparent py-3.5 pl-3 pr-4 text-base outline-none"
              />
            </div>
          ) : (
            <div>
              <div className="flex justify-center gap-2">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      codeInputs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    onPaste={handleCodePaste}
                    onFocus={(e) => e.target.select()}
                    className="tabular h-14 w-11 rounded-xl border border-line bg-transparent text-center text-lg font-semibold outline-none focus:border-accent dark:border-line-dark dark:focus:border-accent-dark"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('phone')
                  setDigits(Array(CODE_LENGTH).fill(''))
                  setError(null)
                }}
                className="mx-auto mt-4 block text-sm text-ink-muted underline underline-offset-2"
              >
                Use a different number
              </button>
            </div>
          )}

          {error && <p className="text-center text-sm text-cat-8">{error}</p>}

          {step === 'phone' && (
            <button
              type="button"
              onClick={submitPhone}
              disabled={busy}
              className="w-full rounded-2xl bg-accent py-3.5 text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-30 dark:bg-accent-dark dark:text-surface-darkplane"
            >
              {busy ? 'Please wait…' : 'Continue'}
            </button>
          )}
        </div>
      </div>

      <div id={RECAPTCHA_CONTAINER_ID} />
    </div>
  )
}
