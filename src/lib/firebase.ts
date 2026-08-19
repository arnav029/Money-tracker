import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth,
  type ConfirmationResult,
  type User
} from 'firebase/auth'

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID

/** True once the app has real Firebase project credentials — phone sign-in only activates then. */
export const isFirebaseConfigured = Boolean(apiKey && authDomain && projectId)

let app: FirebaseApp | null = null
let authInstance: Auth | null = null

if (isFirebaseConfigured) {
  app = initializeApp({ apiKey, authDomain, projectId })
  authInstance = getAuth(app)
}

export const auth = authInstance

let recaptchaVerifier: RecaptchaVerifier | null = null

/** Lazily creates (or reuses) the invisible reCAPTCHA bound to a container element in the DOM. */
function getRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  if (!auth) throw new Error('Firebase is not configured')
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' })
  }
  return recaptchaVerifier
}

export async function sendOtp(phoneNumberE164: string, containerId: string): Promise<ConfirmationResult> {
  if (!auth) throw new Error('Firebase is not configured')
  const verifier = getRecaptchaVerifier(containerId)
  return signInWithPhoneNumber(auth, phoneNumberE164, verifier)
}

export async function confirmOtp(confirmation: ConfirmationResult, code: string): Promise<User> {
  const result = await confirmation.confirm(code)
  return result.user
}

/**
 * Supabase's third-party auth trusts a Firebase JWT only once it carries a `role: authenticated`
 * custom claim, which a Cloud Function attaches on user creation (see functions/index.js). That
 * claim isn't in the token issued at sign-up time, so poll a forced token refresh until it shows up.
 */
export async function waitForAuthenticatedClaim(user: User, timeoutMs = 12000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const result = await user.getIdTokenResult(true)
    if (result.claims.role === 'authenticated') return true
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return false
}

export function signOutFirebase(): Promise<void> {
  if (!auth) return Promise.resolve()
  return firebaseSignOut(auth)
}

export function watchAuthState(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}
